import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Activity, TrendingUp, Users } from "lucide-react";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export default function Dashboard() {
  const { profile } = useAuth();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {profile?.email}</p>
        </div>
        <Button size="lg" className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        {[
          { title: "Total Revenue", value: "$45,231.89", icon: TrendingUp, desc: "+20.1% from last month" },
          { title: "Active Users", value: "+2350", icon: Users, desc: "+180.1% from last month" },
          { title: "Active Projects", value: "12", icon: Activity, desc: "+19% from last month" },
          { title: "Completion Rate", value: "95%", icon: Activity, desc: "+2% from last month" },
        ].map((stat, i) => (
          <motion.div key={i} variants={item}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.desc}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Activity over the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center bg-secondary/10 rounded-lg m-4 border border-dashed border-border">
             <div className="text-center text-muted-foreground">
               <Activity className="mx-auto h-12 w-12 opacity-20 mb-2" />
               <p>Chart Placeholder</p>
               <p className="text-xs">(Install recharts for real data)</p>
             </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>
              You made 265 sales this month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <div key={i} className="flex items-center">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs mr-4">
                    JD
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">John Doe</p>
                    <p className="text-xs text-muted-foreground">john.doe@email.com</p>
                  </div>
                  <div className="ml-auto font-medium">+$1,999.00</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
