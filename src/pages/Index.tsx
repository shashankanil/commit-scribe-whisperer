
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Download, Github, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DateRangePicker from "@/components/DateRangePicker";
import CommitExporter from "@/components/CommitExporter";

const Index = () => {
  const [username, setUsername] = useState("");
  const [repositories, setRepositories] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null);
  const [commits, setCommits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const { toast } = useToast();

  const fetchRepositories = async () => {
    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a GitHub username",
        variant: "destructive",
      });
      return;
    }

    setLoadingRepos(true);
    try {
      const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`);
      if (!response.ok) {
        throw new Error("Failed to fetch repositories");
      }
      const repos = await response.json();
      setRepositories(repos);
      toast({
        title: "Repositories loaded",
        description: `Found ${repos.length} repositories`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch repositories. Please check the username.",
        variant: "destructive",
      });
    } finally {
      setLoadingRepos(false);
    }
  };

  const fetchCommits = async () => {
    if (!selectedRepo || !dateRange) {
      toast({
        title: "Missing information",
        description: "Please select a repository and date range",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setCommits([]);
    
    try {
      let allCommits: any[] = [];
      let page = 1;
      const perPage = 100;

      while (true) {
        const params = new URLSearchParams({
          since: dateRange.from.toISOString(),
          until: dateRange.to.toISOString(),
          per_page: perPage.toString(),
          page: page.toString(),
        });

        const response = await fetch(
          `https://api.github.com/repos/${username}/${selectedRepo}/commits?${params}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch commits");
        }

        const pageCommits = await response.json();
        
        if (pageCommits.length === 0) break;
        
        allCommits = [...allCommits, ...pageCommits];
        page++;

        // If we got less than perPage commits, we've reached the end
        if (pageCommits.length < perPage) break;
      }

      setCommits(allCommits);
      toast({
        title: "Commits loaded",
        description: `Found ${allCommits.length} commits in the selected date range`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch commits. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Github className="h-8 w-8 text-green-400" />
            <h1 className="text-4xl font-bold text-white">GitHub Commit Extractor</h1>
          </div>
          <p className="text-gray-300 text-lg">
            Extract and export your GitHub commits in LLM-friendly format
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Username Input */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Github className="h-5 w-5" />
                GitHub Username
              </CardTitle>
              <CardDescription className="text-gray-400">
                Enter your GitHub username to fetch repositories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="username" className="text-gray-200">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="octocat"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={fetchRepositories}
                    disabled={loadingRepos}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loadingRepos ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Load Repos"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Repository Selection */}
          {repositories.length > 0 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Select Repository</CardTitle>
                <CardDescription className="text-gray-400">
                  Choose the repository to extract commits from
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select a repository" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {repositories.map((repo) => (
                      <SelectItem key={repo.name} value={repo.name} className="text-white hover:bg-gray-600">
                        <div className="flex flex-col">
                          <span>{repo.name}</span>
                          <span className="text-xs text-gray-400">{repo.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Date Range Picker */}
          {selectedRepo && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Date Range
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Select the date range for commit extraction
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DateRangePicker onDateRangeChange={setDateRange} />
              </CardContent>
            </Card>
          )}

          {/* Fetch Commits Button */}
          {selectedRepo && dateRange && (
            <div className="text-center">
              <Button 
                onClick={fetchCommits}
                disabled={loading}
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Fetching Commits...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Extract Commits
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Commit Results */}
          {commits.length > 0 && (
            <CommitExporter 
              commits={commits} 
              username={username}
              repository={selectedRepo}
              dateRange={dateRange!}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
