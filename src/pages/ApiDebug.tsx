import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import api from '@/lib/axios';

interface EndpointStatus {
  endpoint: string;
  status: 'checking' | 'success' | 'error';
  message?: string;
  responseTime?: number;
}

const ApiDebug = () => {
  const [endpoints, setEndpoints] = useState<EndpointStatus[]>([
    { endpoint: '/teams', status: 'checking' },
    { endpoint: '/tournaments', status: 'checking' },
    { endpoint: '/tournament-registrations', status: 'checking' },
    { endpoint: '/matches', status: 'checking' },
    { endpoint: '/standings', status: 'checking' },
  ]);

  const checkEndpoint = async (endpoint: string): Promise<EndpointStatus> => {
    const startTime = Date.now();
    try {
      const response = await api.get(endpoint);
      const responseTime = Date.now() - startTime;
      
      if (response.data) {
        return {
          endpoint,
          status: 'success',
          message: `✓ OK - Data: ${JSON.stringify(response.data).substring(0, 100)}...`,
          responseTime
        };
      }
      
      return {
        endpoint,
        status: 'error',
        message: 'No data returned',
        responseTime
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      return {
        endpoint,
        status: 'error',
        message: error.response?.data?.message || error.message || 'Connection failed',
        responseTime
      };
    }
  };

  const checkAllEndpoints = async () => {
    // Reset all to checking
    setEndpoints(prev => prev.map(e => ({ ...e, status: 'checking' as const })));

    // Check each endpoint
    for (const endpoint of endpoints) {
      const result = await checkEndpoint(endpoint.endpoint);
      setEndpoints(prev => 
        prev.map(e => e.endpoint === endpoint.endpoint ? result : e)
      );
    }
  };

  const getStatusIcon = (status: EndpointStatus['status']) => {
    switch (status) {
      case 'checking':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: EndpointStatus['status']) => {
    switch (status) {
      case 'checking':
        return <Badge variant="outline">Checking...</Badge>;
      case 'success':
        return <Badge className="bg-green-500">OK</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">API Debug Tool</h1>
          <p className="text-muted-foreground">Kiểm tra kết nối tới Backend API</p>
        </div>

        <Alert>
          <AlertTitle>Base URL</AlertTitle>
          <AlertDescription className="font-mono">
            {api.defaults.baseURL || 'http://localhost:8000/api'}
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>API Endpoints Status</CardTitle>
                <CardDescription>Kiểm tra các endpoints của Tournament System</CardDescription>
              </div>
              <Button onClick={checkAllEndpoints} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Check All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {endpoints.map((endpoint) => (
              <div key={endpoint.endpoint} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(endpoint.status)}
                  <div>
                    <p className="font-mono font-semibold">{endpoint.endpoint}</p>
                    {endpoint.message && (
                      <p className="text-sm text-muted-foreground">{endpoint.message}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {endpoint.responseTime !== undefined && (
                    <span className="text-sm text-muted-foreground">
                      {endpoint.responseTime}ms
                    </span>
                  )}
                  {getStatusBadge(endpoint.status)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Alert>
          <AlertTitle>Hướng dẫn Debug</AlertTitle>
          <AlertDescription className="space-y-2">
            <ol className="list-decimal list-inside space-y-1">
              <li>Đảm bảo backend Laravel đang chạy ở <code>http://localhost:8000</code></li>
              <li>Kiểm tra database đã migrate chưa: <code>php artisan migrate</code></li>
              <li>Kiểm tra routes: <code>php artisan route:list | grep api</code></li>
              <li>Xem log backend: <code>tail -f storage/logs/laravel.log</code></li>
              <li>Kiểm tra CORS đã config chưa</li>
            </ol>
          </AlertDescription>
        </Alert>

        <div className="text-center text-sm text-muted-foreground">
          <p>Nếu tất cả endpoints đều error, có thể:</p>
          <ul className="list-disc list-inside">
            <li>Backend chưa chạy</li>
            <li>URL không đúng (check file src/lib/axios.ts)</li>
            <li>CORS bị block</li>
            <li>Routes chưa được define trong backend</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ApiDebug;
