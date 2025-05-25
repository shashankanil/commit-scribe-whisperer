
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Filter, Info } from "lucide-react";

interface Repository {
  name: string;
  full_name: string;
  description: string;
  language: string;
}

interface CommitFilterProps {
  repositories: Repository[];
  commits: any[];
  onFilterChange: (filteredCommits: any[], tokenCount: number) => void;
}

const CommitFilter = ({ repositories, commits, onFilterChange }: CommitFilterProps) => {
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [detailLevel, setDetailLevel] = useState([3]); // 1 = minimal, 5 = maximum detail
  const [tokenCount, setTokenCount] = useState(0);

  const handleRepoToggle = (repoName: string) => {
    const updated = selectedRepos.includes(repoName)
      ? selectedRepos.filter(r => r !== repoName)
      : [...selectedRepos, repoName];
    
    setSelectedRepos(updated);
    applyFilters(updated, detailLevel[0]);
  };

  const handleDetailLevelChange = (value: number[]) => {
    setDetailLevel(value);
    applyFilters(selectedRepos, value[0]);
  };

  const applyFilters = (repos: string[], detail: number) => {
    // Filter commits by selected repositories
    const filteredCommits = commits.filter(commit => {
      if (repos.length === 0) return true;
      const repoName = commit.repository?.name || 'unknown';
      return repos.includes(repoName);
    });

    // Calculate token count based on detail level
    const tokensPerCommit = getTokensPerCommit(detail);
    const estimatedTokens = filteredCommits.length * tokensPerCommit;
    
    setTokenCount(estimatedTokens);
    onFilterChange(filteredCommits, estimatedTokens);
  };

  const getTokensPerCommit = (level: number): number => {
    // Rough token estimates based on detail level
    const tokenMap = {
      1: 25,   // Very minimal: just SHA and message title
      2: 50,   // Basic: SHA, title, author, date
      3: 100,  // Standard: above + description + stats
      4: 150,  // Detailed: above + file changes
      5: 200   // Maximum: everything including diffs
    };
    return tokenMap[level as keyof typeof tokenMap] || 100;
  };

  const getDetailLevelDescription = (level: number): string => {
    const descriptions = {
      1: "Minimal: SHA + Title only",
      2: "Basic: Core info + Author + Date", 
      3: "Standard: Above + Description + Stats",
      4: "Detailed: Above + File changes",
      5: "Maximum: Full commit data + Diffs"
    };
    return descriptions[level as keyof typeof descriptions] || "Standard";
  };

  const getTokenColor = (tokens: number): string => {
    if (tokens < 1000) return "bg-green-600";
    if (tokens < 5000) return "bg-yellow-600";
    if (tokens < 10000) return "bg-orange-600";
    return "bg-red-600";
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filter & Optimize Commits
        </CardTitle>
        <CardDescription className="text-gray-400">
          Select repositories and adjust detail level to optimize for LLM context
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Repository Selection */}
        <div className="space-y-3">
          <h4 className="text-white font-medium">Select Repositories</h4>
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
            {repositories.map((repo) => (
              <div key={repo.name} className="flex items-center space-x-2">
                <Checkbox
                  id={repo.name}
                  checked={selectedRepos.includes(repo.name)}
                  onCheckedChange={() => handleRepoToggle(repo.name)}
                  className="border-gray-600"
                />
                <label
                  htmlFor={repo.name}
                  className="text-sm text-gray-200 cursor-pointer flex-1"
                >
                  <div className="font-medium">{repo.name}</div>
                  {repo.description && (
                    <div className="text-gray-400 text-xs">{repo.description}</div>
                  )}
                </label>
                {repo.language && (
                  <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
                    {repo.language}
                  </Badge>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => setSelectedRepos(repositories.map(r => r.name))}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-200 hover:bg-gray-700"
            >
              Select All
            </Button>
            <Button
              onClick={() => setSelectedRepos([])}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-200 hover:bg-gray-700"
            >
              Clear All
            </Button>
          </div>
        </div>

        {/* Detail Level Slider */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="text-white font-medium">Detail Level</h4>
            <Info className="h-4 w-4 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            <Slider
              value={detailLevel}
              onValueChange={handleDetailLevelChange}
              max={5}
              min={1}
              step={1}
              className="w-full"
            />
            
            <div className="flex justify-between text-xs text-gray-400">
              <span>Minimal</span>
              <span>Maximum</span>
            </div>
            
            <div className="text-center">
              <Badge variant="outline" className="border-gray-600 text-gray-300">
                {getDetailLevelDescription(detailLevel[0])}
              </Badge>
            </div>
          </div>
        </div>

        {/* Token Count Display */}
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-gray-200">Estimated Token Count:</span>
            <Badge className={`${getTokenColor(tokenCount)} text-white`}>
              {tokenCount.toLocaleString()} tokens
            </Badge>
          </div>
          
          <div className="mt-2 text-sm text-gray-400">
            <div>• Filtered commits: {commits.filter(c => selectedRepos.length === 0 || selectedRepos.includes(c.repository?.name || 'unknown')).length}</div>
            <div>• Tokens per commit: ~{getTokensPerCommit(detailLevel[0])}</div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};

export default CommitFilter;
