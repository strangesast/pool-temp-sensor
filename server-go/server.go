package main // import github.com/strangesast/pool-temp-sensor/server-go

import (
	"context"
	"fmt"
	pb "github.com/strangesast/pool-temp-sensor/server-go/proto"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"google.golang.org/grpc"
	"io"
	"log"
	"net"
	"os"
	"os/signal"
)

var db *mongo.Client
var temps *mongo.Collection
var mongoCtx context.Context

// TempSensorServer handles retrieving and storing temperature readings
type tempSensorServer struct {
}

// GetTemps retrieves temperature readings in date range. if enddate is undefined,
// stream new readings
func (s *tempSensorServer) GetTemps(req *pb.DateRange, stream pb.TempSensor_GetTempsServer) error {
	ctx := stream.Context()
	cur, err := temps.Find(ctx, bson.D{})
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
	for {
		reading, err := stream.Recv()
		if err == io.EOF {
			// endTime := time.Now()
			return nil
			// return stream.SendAndClose(&RouteSummary{
			// 	PointCount:   pointCount,
			// 	FeatureCount: featureCount,
			// 	Distance:     distance,
			// 	ElapsedTime:  int32(endTime.Sub(startTime).Seconds()),
			// })
		}
		if err != nil {
			return err
		}
		ctx := stream.Context()
		for id, value := range reading.Values {
			_, err := temps.InsertOne(ctx, bson.M{"id": id, "value": value, "date": reading.Date})
			if err != nil {
				log.Fatal(err)
			}
		}
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
	db, err = mongo.Connect(mongoCtx, options.Client().ApplyURI("mongodb://localhost:27017"))

	if err != nil {
		log.Fatal(err)
	}

	err = db.Ping(mongoCtx, nil)

	if err != nil {
		log.Fatalf("Could not connect to MongoDB: %v\n", err)
	} else {
		fmt.Println("Connected to MongoDB")
	}

	temps = db.Database("temp-sensor").Collection("temps")

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
	db.Disconnect(mongoCtx)
	fmt.Println("Done.")
}