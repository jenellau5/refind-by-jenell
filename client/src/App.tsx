import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

import Home from "@/pages/Home";
import ReFinds from "@/pages/ReFinds";
import KidsReFinds from "@/pages/KidsReFinds";
import Under10 from "@/pages/Under10";
import StyledByJenell from "@/pages/StyledByJenell";
import Sold from "@/pages/Sold";
import ItemDetail from "@/pages/ItemDetail";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
          <Route path="/" component={Home} />
          <Route path="/refinds" component={ReFinds} />
          <Route path="/kids" component={KidsReFinds} />
          <Route path="/under10" component={Under10} />
          <Route path="/styled" component={StyledByJenell} />
          <Route path="/sold" component={Sold} />
          <Route path="/item/:id" component={ItemDetail} />
          <Route path="/admin" component={Admin} />
          <Route component={NotFound} />
      </Switch>
      <Toaster />
    </QueryClientProvider>
  );
}
