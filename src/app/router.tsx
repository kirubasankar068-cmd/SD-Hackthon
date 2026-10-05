import { createBrowserRouter, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { OverviewPage } from '../pages/OverviewPage';
import { PlaceholderPage } from '../pages/PlaceholderPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <OverviewPage />,
      },
      {
        path: 'flash-sale',
        element: (
          <PlaceholderPage
            title="Flash Sale Engine"
            phase="Phase 2"
            description="Live execution controls for concurrent customer requests and stock burst testing."
          />
        ),
      },
      {
        path: 'inventory',
        element: (
          <PlaceholderPage
            title="Inventory Management"
            phase="Phase 2"
            description="Real-time Redis atomic Lua reservation and stock allocation monitor."
          />
        ),
      },
      {
        path: 'reservations',
        element: (
          <PlaceholderPage
            title="Stock Reservations"
            phase="Phase 2"
            description="TTL expiration tracking and active reservation status lifecycle."
          />
        ),
      },
      {
        path: 'payments',
        element: (
          <PlaceholderPage
            title="Payment Processing"
            phase="Phase 2"
            description="Payment gateway execution, timeout simulation, and circuit breaker status."
          />
        ),
      },
      {
        path: 'orders',
        element: (
          <PlaceholderPage
            title="Order Fulfillment"
            phase="Phase 2"
            description="Asynchronous order creation, line items persistence, and state machine."
          />
        ),
      },
      {
        path: 'failures',
        element: (
          <PlaceholderPage
            title="Failure Simulator"
            phase="Phase 2"
            description="Chaos testing controls for Order Service outage and gateway network drops."
          />
        ),
      },
      {
        path: 'architecture',
        element: (
          <PlaceholderPage
            title="System Architecture"
            phase="Phase 2"
            description="Interactive C4 component diagrams and request path visualization."
          />
        ),
      },
      {
        path: 'observability',
        element: (
          <PlaceholderPage
            title="Observability & Telemetry"
            phase="Phase 2"
            description="Prometheus metrics, structured JSON logs, and Jaeger trace graphs."
          />
        ),
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
