/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SchedulingProvider, useScheduling } from './context/SchedulingContext';
import { Header } from './components/Header';
import { ClockController } from './components/ClockController';
import { ManagementTower } from './components/ManagementTower';
import { CentralTracker } from './components/CentralTracker';
import { InternWorkbench } from './components/InternWorkbench';
import { DemoCenter } from './components/DemoCenter';
import { SopViewer } from './components/SopViewer';
import { TestPlanViewer } from './components/TestPlanViewer';
import { RequestActionModal } from './components/RequestActionModal';
import { RequestDetailModal } from './components/RequestDetailModal';
import { InterviewRequest } from './types';

const SchedulingAppContent: React.FC = () => {
  const { activeView, selectedRequestId, setSelectedRequestId, requests } = useScheduling();
  const [actionModalRequest, setActionModalRequest] = useState<InterviewRequest | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Header & Navigation */}
      <Header />

      {/* Controllable Operations Clock Banner */}
      <ClockController />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {activeView === 'management' && <ManagementTower />}

        {activeView === 'tracker' && (
          <CentralTracker
            onOpenActions={(req) => setActionModalRequest(req)}
            onOpenDetails={(req) => setSelectedRequestId(req.id)}
          />
        )}

        {activeView === 'ram' && (
          <InternWorkbench
            internName="Ram"
            onOpenActions={(req) => setActionModalRequest(req)}
            onOpenDetails={(req) => setSelectedRequestId(req.id)}
          />
        )}

        {activeView === 'shyam' && (
          <InternWorkbench
            internName="Shyam"
            onOpenActions={(req) => setActionModalRequest(req)}
            onOpenDetails={(req) => setSelectedRequestId(req.id)}
          />
        )}

        {activeView === 'demo' && <DemoCenter />}

        {activeView === 'sop' && <SopViewer />}

        {activeView === 'test_plan' && <TestPlanViewer />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-300">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Weekday Scheduling Operations Control Tower • <strong>MVP v1.0</strong>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <span>Deterministic 50/50 Allocation</span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">80% 24h SLA Target</span>
            <span>•</span>
            <span>Zero Unverified Closures</span>
          </div>
        </div>
      </footer>

      {/* Action Drawer / Modal */}
      {actionModalRequest && (
        <RequestActionModal
          request={actionModalRequest}
          onClose={() => setActionModalRequest(null)}
        />
      )}

      {/* Detail Dossier Modal */}
      {selectedRequestId && (
        <RequestDetailModal
          requestId={selectedRequestId}
          onClose={() => setSelectedRequestId(null)}
          onOpenActions={() => {
            const target = requests.find((r) => r.id === selectedRequestId);
            if (target) {
              setActionModalRequest(target);
            }
            setSelectedRequestId(null);
          }}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <SchedulingProvider>
      <SchedulingAppContent />
    </SchedulingProvider>
  );
}
