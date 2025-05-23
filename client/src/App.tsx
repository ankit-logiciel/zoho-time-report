import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import ReportBuilder from "@/pages/report-builder";
import RevenueOpportunities from "@/pages/revenue-opportunities";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/report-builder" component={ReportBuilder} />
      <Route path="/revenue-opportunities" component={RevenueOpportunities} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
