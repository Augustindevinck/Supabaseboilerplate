import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal, Calendar, Clock } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export default function Projects() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage your ongoing projects and campaigns.</p>
        </div>
        <Button className="shadow-lg shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" />
          Create Project
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="hover:shadow-md transition-shadow group">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-lg">Project Alpha {i}</CardTitle>
                <CardDescription>Marketing Campaign</CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Edit project</DropdownMenuItem>
                  <DropdownMenuItem>View details</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                A brief description of the project goals and current status to keep everyone aligned.
              </p>
              <div className="flex gap-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0">In Progress</Badge>
                <Badge variant="outline">High Priority</Badge>
              </div>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground border-t bg-secondary/20 py-3 flex justify-between">
              <div className="flex items-center">
                <Calendar className="mr-1 h-3 w-3" />
                Due Oct 24
              </div>
              <div className="flex items-center">
                <Clock className="mr-1 h-3 w-3" />
                Updated 2h ago
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
