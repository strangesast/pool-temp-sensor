package main // import github.com/strangesast/pool-temp-sensor/server-go

import (
	"context"
	"fmt"
	pb "github.com/strangesast/pool-temp-sensor/server-go/proto"
	"go.mongodb.org/mongo-driver/bson"
	// "go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"google.golang.org/grpc"
	"io"
	"log"
	"net"
	"os"
	"os/signal"
	"time"
)

var client *mongo.Client
var temps *mongo.Collection
var sensors *mongo.Collection
var mongoCtx context.Context

var ids map[string]struct{}

// TempSensorServer handles retrieving and storing temperature readings
type tempSensorServer struct {
}

// initialize which sensor ids have already been stored in the database
func initializeIDs(ctx context.Context) error {
	result, err := temps.Distinct(ctx, "id", bson.M{})

	if err != nil {
		return err
	}

	ids = make(map[string]struct{})

	for _, id := range result {
		ids[id.(string)] = struct{}{}
	}

	return nil
}

// GetTemps retrieves temperature readings in date range. if enddate is undefined,
// stream new readings
func (s *tempSensorServer) GetTemps(req *pb.DateRange, stream pb.TempSensor_GetTempsServer) error {
	ctx := stream.Context()
	pipeline := []bson.M{
		bson.M{
			"$bucketAuto": bson.M{
				"groupBy": "date",
			},
			"buckets": 100,
		},
	}
	cur, err := temps.Aggregate(ctx, pipeline)
	if err != nil {
		log.Fatal(err)
	}
	defer cur.Close(ctx)
	for cur.Next(ctx) {
		var result pb.Temps
		err := cur.Decode(&result)
		if err != nil {
			log.Fatal(err)
		}
		if err := stream.Send(&result); err != nil {
			return err
		}
	}
	return nil
}

func (s *tempSensorServer) RecordTemps(stream pb.TempSensor_RecordTempsServer) error {
	var err error
	var count int32
	var uniqueSensorsCount int32
	var session mongo.Session
	if session, err = client.StartSession(); err != nil {
		log.Fatal(err)
	}
	for {
		var reading *pb.Temps
		if reading, err = stream.Recv(); err == io.EOF {
			return stream.SendAndClose(&pb.TempsWriteSummary{
				Count:       count,
				SensorCount: uniqueSensorsCount,
			})
		} else if err != nil {
			log.Fatal(err)
		}

		if err = session.StartTransaction(); err != nil {
			log.Fatal(err)
		}

		ctx := stream.Context()

		if err = mongo.WithSession(ctx, session, func(sc mongo.SessionContext) error {
			var tempsWrites []mongo.WriteModel
			var sensorWrites []mongo.WriteModel
			for id, value := range reading.Values {
				if _, ok := ids[id]; !ok {
					sensorWrites = append(sensorWrites, mongo.NewUpdateOneModel().
						SetFilter(bson.M{"id": id}).
						SetUpdate(bson.M{"$set": bson.M{"id": id}}).SetUpsert(true))
					ids[id] = struct{}{}
					uniqueSensorsCount++
				}
				date := time.Unix(reading.Date.GetSeconds(), 0)
				sec := date.Second()
				date = date.Truncate(time.Minute)

				filter := bson.M{"id": id, "date": date}
				update := bson.M{
					"$push": bson.M{
						"values": bson.M{
							"second": sec,
							"value":  value,
						},
					},
					"$inc": bson.M{
						"total": value,
						"count": 1,
					},
				}
				model := mongo.NewUpdateOneModel().SetFilter(filter).SetUpdate(update).SetUpsert(true)

				tempsWrites = append(tempsWrites, model)

				count++

			}
			if len(tempsWrites) > 0 {
				if _, err = temps.BulkWrite(ctx, tempsWrites); err != nil {
					log.Fatal(err)
				}
			}
			if len(sensorWrites) > 0 {
				if _, err = sensors.BulkWrite(ctx, sensorWrites); err != nil {
					log.Fatal(err)
				}
			}
			if err = session.CommitTransaction(sc); err != nil {
				log.Fatal(err)
			}
			return nil
		}); err != nil {
			log.Fatal(err)
		}

		fmt.Println(reading)
	}
}

func main() {
	fmt.Println("Starting...")

	fmt.Println("Waiting on listener...")
	listener, err := net.Listen("tcp", ":50051")

	if err != nil {
		log.Fatalf("Unable to listen on port 50051: %v", err)
	}

	opts := []grpc.ServerOption{}

	s := grpc.NewServer(opts...)

	srv := &tempSensorServer{}

	fmt.Println("Registering grpc server...")
	pb.RegisterTempSensorServer(s, srv)

	mongoCtx = context.Background()
	fmt.Println("Connecting to mongo...")
	client, err = mongo.Connect(mongoCtx, options.Client().ApplyURI("mongodb://localhost:27017"))

	if err != nil {
		log.Fatal(err)
	}

	err = client.Ping(mongoCtx, nil)

	if err != nil {
		log.Fatalf("Could not connect to MongoDB: %v\n", err)
	} else {
		fmt.Println("Connected to MongoDB")
	}

	db := client.Database("temp-sensor")
	temps = db.Collection("temps")
	sensors = db.Collection("sensors")

	fmt.Println("Initializing...")

	err = initializeIDs(mongoCtx)
	if err != nil {
		log.Fatalf("Error initializing! %v\n", err)
	}

	go func() {
		if err := s.Serve(listener); err != nil {
			log.Fatalf("Failed to serve: %v", err)
		}
	}()
	fmt.Println("Listening on port 50051")

	c := make(chan os.Signal)

	signal.Notify(c, os.Interrupt)

	<-c
	fmt.Println("\nStopping...")
	s.Stop()
	listener.Close()
	fmt.Println("Closing MongoDB connection")
	client.Disconnect(mongoCtx)
	fmt.Println("Done.")
}
