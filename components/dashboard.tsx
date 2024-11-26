"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { X } from "lucide-react";

// Define types
type SensorData = {
  sensorData: {
    duration: number;
    average: number;
    pressure: number;
    peak: number;
    variability: number;
    thresholdExceeded: boolean;
  };
  deviceId: string;
  timestamp: number;
};

const PRESSURE_THRESHOLD = 3000;
const MAX_PRESSURE = 4095;

const Dashboard = () => {
  // State initialization
  const [currentDateTime, setCurrentDateTime] = useState<string | null>(null);
  const [currentData, setCurrentData] = useState<SensorData | null>(null);
  const [historicalData, setHistoricalData] = useState<SensorData[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);

  // Format date consistently
  const formatDateTime = (date: Date): string => {
    return date.toISOString().slice(0, 19).replace("T", " ");
  };

  // Update time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDateTime(formatDateTime(now));
    };

    updateTime(); // Initial update
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check threshold and show alert
  useEffect(() => {
    if (
      currentData?.sensorData.pressure &&
      currentData?.sensorData.pressure > PRESSURE_THRESHOLD
    ) {
      setShowAlert(true);
    }
  }, [currentData]);

  // Transform DynamoDB data
  const transformDynamoData = (dynamoData: any): SensorData | null => {
    if (!dynamoData) return null;

    try {
      return {
        sensorData: {
          duration: Number(dynamoData.payload.sensorData.duration || 0),
          average: Number(dynamoData.payload.sensorData.average || 0),
          pressure: Number(dynamoData.payload.sensorData.pressure || 0),
          peak: Number(dynamoData.payload.sensorData.peak || 0),
          variability: Number(dynamoData.payload.sensorData.variability || 0),
          thresholdExceeded: Boolean(
            dynamoData.payload.sensorData.thresholdExceeded || false
          ),
        },
        deviceId: dynamoData.deviceId || "ESP32_Skin_Pressure_Detector",
        timestamp: Number(dynamoData.timestamp || Date.now()),
      };
    } catch (error) {
      console.error("Error transforming data:", error);
      return null;
    }
  };

  // Fetch data every second
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/sensor-data");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const rawData = await response.json();
        if (!rawData || rawData.length === 0) {
          throw new Error("No data found");
        }
        const transformedData = rawData
          .map(transformDynamoData)
          .filter(Boolean);
        if (transformedData.length === 0) {
          throw new Error("Failed to transform data");
        }

        setCurrentData(transformedData[transformedData.length - 1]);
        setHistoricalData(transformedData);
        setLastUpdate(formatDateTime(new Date()));
        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      }
    };

    // Initial fetch
    fetchData();

    // Set up polling interval
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">
          SkinGuard - Pressure Sensor Dashboard
        </h1>
        <div className="text-sm text-gray-500 text-right space-y-1">
          {currentDateTime && (
            <div className="font-medium">
              Current Date and Time (UTC): {currentDateTime}
            </div>
          )}
          <div>Current User's Login: Shafny</div>
          <div>Last Updated: {lastUpdate || "Never"}</div>
        </div>
      </div>

      {/* Pressure Alert */}
      {showAlert && (
        <Alert variant="destructive" className="relative">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>High Pressure Warning</AlertTitle>
          <AlertDescription>
            Current pressure ({currentData?.sensorData.pressure.toFixed(2)} Pa)
            has exceeded the threshold of {PRESSURE_THRESHOLD} Pa!
          </AlertDescription>
          <button
            onClick={() => setShowAlert(false)}
            className="absolute top-2 right-2 p-1 hover:bg-red-100 rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Current Values */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Pressure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentData?.sensorData.pressure.toFixed(2) || "0.00"} Pa
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Pressure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentData?.sensorData.peak.toFixed(2) || "0.00"} Pa
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Pressure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentData?.sensorData.average.toFixed(2) || "0.00"} Pa
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentData?.sensorData.variability.toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pressure Chart */}
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Pressure Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(timestamp) => {
                    return new Date(timestamp)
                      .toISOString()
                      .split("T")[1]
                      .slice(0, 8);
                  }}
                />
                <YAxis domain={[0, MAX_PRESSURE]} />
                <Tooltip
                  labelFormatter={(timestamp) => {
                    return new Date(timestamp)
                      .toISOString()
                      .replace("T", " ")
                      .slice(0, 19);
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)} Pa`]}
                />
                <Line
                  type="monotone"
                  dataKey="sensorData.pressure"
                  stroke="#2563eb"
                  dot={false}
                  name="Pressure"
                />
                <Line
                  type="monotone"
                  dataKey="sensorData.average"
                  stroke="#16a34a"
                  dot={false}
                  name="Average"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Peak Pressure Chart */}
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Peak Pressure History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(timestamp) => {
                    return new Date(timestamp)
                      .toISOString()
                      .split("T")[1]
                      .slice(0, 8);
                  }}
                />
                <YAxis domain={[0, MAX_PRESSURE]} />
                <Tooltip
                  labelFormatter={(timestamp) => {
                    return new Date(timestamp)
                      .toISOString()
                      .replace("T", " ")
                      .slice(0, 19);
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)} Pa`]}
                />
                <Line
                  type="monotone"
                  dataKey="sensorData.peak"
                  stroke="#dc2626"
                  dot={false}
                  name="Peak Pressure"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
