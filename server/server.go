package main // import github.com/strangesast/pool-temp-sensor/server

import (
	"context"
	"fmt"
	pb "github.com/strangesast/pool-temp-sensor/proto"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"google.golang.org/grpc"
	"io"
	"log"
	"net"
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
			// return stream.SendAndClose(&pb.RouteSummary{
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

	listener, err := net.Listen("tcp", ":50051")

	if err != nil {
		log.Fatalf("Unable to listen on port 50051: %v", err)
	}

	fmt.Println("Listening on port 50051")

	opts := []grpc.ServerOption{}

	s := grpc.NewServer(opts...)

	srv := &tempSensorServer{}

	pb.RegisterTempSensorServer(s, srv)

	mongoCtx = context.Background()
	db, err = mongo.Connect(mongoCtx, options.Client().ApplyURI("mongodb://localhost:27017"))

	temps = db.Database("temp-sensor").Collection("temps")

	go func() {
		if err := s.Serve(listener); err != nil {
			log.Fatalf("Failed to serve: %v", err)
		}
	}()

	if err != nil {
		log.Fatal("failed to connect to mongo")
	}

}
