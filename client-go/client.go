package main // import github.com/strangesast/pool-temp-sensor/client-go

import (
	"context"
	"github.com/kr/pretty"
	pb "github.com/strangesast/pool-temp-sensor/client-go/proto"
	"google.golang.org/grpc"
	"log"
	"time"
)

const (
	serverAddr = "localhost:50051"
)

// printFeature gets the feature for the given point.
func printTemps(client pb.TempSensorClient, dateRange *pb.DateRange) {
	log.Printf("Getting temps in date range %v", dateRange)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	log.Println("Getting temps")
	feature, err := client.GetTemps(ctx, dateRange)
	log.Println("Got temps")
	if err != nil {
		log.Fatalf("%v.GetTemps(_) = _, %v: ", client, err)
	}
	log.Println("Printing...")
	temps, err := feature.Recv()
	if err != nil {
		log.Fatalf("failed to read response")
	}
	log.Printf("%# v", pretty.Formatter(temps))
}

func main() {
	var opts []grpc.DialOption
	opts = append(opts, grpc.WithInsecure())
	conn, err := grpc.Dial(serverAddr, opts...)
	if err != nil {
		log.Fatalf("fail to dial: %v", err)
	}
	defer conn.Close()
	client := pb.NewTempSensorClient(conn)

	printTemps(client, &pb.DateRange{})
}
