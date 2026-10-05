import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { useSimulationStore } from './store/useSimulationStore';
import { FlashSaleTab } from './tabs/FlashSaleTab';
import { CustomerDetailsTab } from './tabs/CustomerDetailsTab';
import { InventoryTab } from './tabs/InventoryTab';
import { ReservationsTab } from './tabs/ReservationsTab';
import { PaymentsTab } from './tabs/PaymentsTab';
import { OrdersTab } from './tabs/OrdersTab';
import { WaitlistRefundsTab } from './tabs/WaitlistRefundsTab';
import { FailureSimulatorTab } from './tabs/FailureSimulatorTab';
import { ArchitectureTab } from './tabs/ArchitectureTab';
import { ObservabilityTab } from './tabs/ObservabilityTab';
import { ProblemDashboard } from './pages/ProblemDashboard';
import { CompareView } from './pages/CompareView';

export function App() {
  const { activeView, activeTab } = useSimulationStore();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'flash-sale':
        return <FlashSaleTab />;
      case 'customer-details':
        return <CustomerDetailsTab />;
      case 'inventory':
        return <InventoryTab />;
      case 'reservations':
        return <ReservationsTab />;
      case 'payments':
        return <PaymentsTab />;
      case 'orders':
        return <OrdersTab />;
      case 'waitlist-refunds':
        return <WaitlistRefundsTab />;
      case 'failures':
        return <FailureSimulatorTab />;
      case 'architecture':
        return <ArchitectureTab />;
      case 'observability':
        return <ObservabilityTab />;
      default:
        return <FlashSaleTab />;
    }
  };

  return (
    <div className="h-screen w-screen max-h-screen overflow-hidden bg-[#0B0F17] text-[#F8FAFC] flex flex-col font-sans antialiased selection:bg-[#C58AF9] selection:text-[#1A1C21]">
      {/* Top Header Bar for Switching Views & API Status */}
      <TopHeader />

      {/* View Router */}
      <div className="flex-1 flex overflow-hidden bg-[#0B0F17]">
        {activeView === 'main' ? (
          <>
            {/* Left Sidebar with 10 exact tabs */}
            <Sidebar />

            {/* Main View displaying selected tab */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#0B0F17]">
              <div className="max-w-7xl mx-auto space-y-6">
                {renderTabContent()}
              </div>
            </main>
          </>
        ) : activeView === 'problem' ? (
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#0B0F17]">
            <div className="max-w-7xl mx-auto">
              <ProblemDashboard />
            </div>
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#0B0F17]">
            <div className="max-w-7xl mx-auto">
              <CompareView />
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

export default App;
