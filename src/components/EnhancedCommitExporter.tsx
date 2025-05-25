
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface EnhancedCommitExporterProps {
  commits: any[];
  filteredCommits: any[];
  username: string;
  selectedRepos: string[];
  dateRange: { from: Date; to: Date };
  detailLevel: number;
  tokenCount: number;
}

const EnhancedCommitExporter = ({ 
  commits, 
  filteredCommits, 
  username, 
  selectedRepos,
  dateRange, 
  detailLevel,
  tokenCount 
}: EnhancedCommitExporterProps) => {
  const [exportedText, setExportedText] = useState("");
  const { toast } = useToast();

  const generateOptimizedFormat = () => {
    const header = `# GitHub Commit Analysis - Optimized for LLM

**User:** ${username}
**Repositories:** ${selectedRepos.length > 0 ? selectedRepos.join(', ') : 'All repositories'}
**Date Range:** ${format(dateRange.from, 'yyyy-MM-dd')} to ${format(dateRange.to, 'yyyy-MM-dd')}
**Total Commits:** ${filteredCommits.length} (filtered from ${commits.length})
**Detail Level:** ${getDetailLevelName(detailLevel)}
**Estimated Tokens:** ${tokenCount.toLocaleString()}
**Generated:** ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}

---

## Commit Data

`;

    const commitDetails = filteredCommits.map((commit, index) => {
      return formatCommitByDetailLevel(commit, index + 1, detailLevel);
    }).join('\n');

    const summary = `
## Summary

- **Commits analyzed:** ${filteredCommits.length}
- **Repositories:** ${selectedRepos.length > 0 ? selectedRepos.length : 'All'}
- **Time span:** ${Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} days
- **Average commits/day:** ${(filteredCommits.length / Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))).toFixed(2)}

### Repository Breakdown
${getRepositoryBreakdown()}

### Author Analysis
${getAuthorAnalysis()}

---

*This data is optimized for LLM analysis with ${detailLevel}/5 detail level. Ask questions about patterns, productivity, code changes, or development insights.*`;

    const fullText = header + commitDetails + summary;
    setExportedText(fullText);
    
    toast({
      title: "Optimized export generated",
      description: `Generated ${tokenCount.toLocaleString()} tokens for ${filteredCommits.length} commits`,
    });
  };

  const formatCommitByDetailLevel = (commit: any, index: number, level: number): string => {
    const date = new Date(commit.commit.author.date);
    const message = commit.commit.message.split('\n');
    const title = message[0];
    const body = message.slice(1).join('\n').trim();

    switch (level) {
      case 1: // Minimal
        return `${index}. ${commit.sha.substring(0, 8)} - ${title}\n`;

      case 2: // Basic  
        return `${index}. **${title}**
   SHA: ${commit.sha.substring(0, 8)} | Author: ${commit.commit.author.name} | ${format(date, 'MMM dd, yyyy')}
`;

      case 3: // Standard
        return `### ${index}. ${title}
**SHA:** ${commit.sha.substring(0, 8)}
**Date:** ${format(date, 'yyyy-MM-dd HH:mm')}
**Author:** ${commit.commit.author.name}
${body ? `**Details:** ${body}\n` : ''}
---
`;

      case 4: // Detailed
        return `### ${index}. ${title}
**SHA:** ${commit.sha.substring(0, 8)}
**Date:** ${format(date, 'yyyy-MM-dd HH:mm:ss')}
**Author:** ${commit.commit.author.name} <${commit.commit.author.email}>
**Repository:** ${commit.repository?.name || 'Unknown'}
${body ? `**Description:** ${body}\n` : ''}
**URL:** ${commit.html_url}

---
`;

      case 5: // Maximum
        return `### ${index}. ${title}
**SHA:** ${commit.sha}
**Date:** ${format(date, 'yyyy-MM-dd HH:mm:ss')}
**Author:** ${commit.commit.author.name} <${commit.commit.author.email}>
**Repository:** ${commit.repository?.name || 'Unknown'}
${body ? `**Description:**\n${body}\n` : ''}
**Stats:** ${commit.stats ? `+${commit.stats.additions || 0} -${commit.stats.deletions || 0}` : 'N/A'}
**Files changed:** ${commit.files ? commit.files.length : 'N/A'}
**URL:** ${commit.html_url}

---
`;

      default:
        return formatCommitByDetailLevel(commit, index, 3);
    }
  };

  const getDetailLevelName = (level: number): string => {
    const names = {
      1: "Minimal",
      2: "Basic", 
      3: "Standard",
      4: "Detailed",
      5: "Maximum"
    };
    return names[level as keyof typeof names] || "Standard";
  };

  const getRepositoryBreakdown = (): string => {
    const repoCount = filteredCommits.reduce((acc, commit) => {
      const repo = commit.repository?.name || 'Unknown';
      acc[repo] = (acc[repo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(repoCount)
      .map(([repo, count]) => `- **${repo}:** ${count} commits`)
      .join('\n');
  };

  const getAuthorAnalysis = (): string => {
    const authorCount = filteredCommits.reduce((acc, commit) => {
      const author = commit.commit.author.name;
      acc[author] = (acc[author] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(authorCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([author, count]) => `- **${author}:** ${count} commits`)
      .join('\n');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(exportedText);
      toast({
        title: "Copied to clipboard",
        description: "Optimized commit data copied successfully",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadAsFile = () => {
    const blob = new Blob([exportedText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const repoSuffix = selectedRepos.length > 0 ? `-${selectedRepos.join('-')}` : '';
    a.download = `github-commits-${username}${repoSuffix}-${format(dateRange.from, 'yyyy-MM-dd')}-optimized.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "File downloaded",
      description: "Optimized commit data saved successfully",
    });
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Optimized Export Results
        </CardTitle>
        <CardDescription className="text-gray-400">
          Filtered {filteredCommits.length} commits optimized for LLM analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary" className="bg-green-600 text-white">
            {filteredCommits.length} commits
          </Badge>
          <Badge variant="outline" className="border-gray-600 text-gray-300">
            {tokenCount.toLocaleString()} tokens
          </Badge>
          <Badge variant="outline" className="border-gray-600 text-gray-300">
            {getDetailLevelName(detailLevel)} detail
          </Badge>
          <Badge variant="outline" className="border-gray-600 text-gray-300">
            {selectedRepos.length || 'All'} repos
          </Badge>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={generateOptimizedFormat}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate Optimized Export
          </Button>

          {exportedText && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">
                  Optimized Content ({tokenCount.toLocaleString()} tokens)
                </label>
                <Textarea
                  value={exportedText}
                  readOnly
                  className="min-h-[300px] bg-gray-700 border-gray-600 text-white font-mono text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={copyToClipboard}
                  variant="outline" 
                  className="flex-1 border-gray-600 text-gray-200 hover:bg-gray-700"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy ({tokenCount.toLocaleString()} tokens)
                </Button>
                <Button 
                  onClick={downloadAsFile}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-200 hover:bg-gray-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download .md
                </Button>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="text-white font-medium mb-2">🚀 Optimized for LLMs:</h4>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• **Token-optimized:** {tokenCount.toLocaleString()} tokens at {getDetailLevelName(detailLevel)} detail level</li>
                  <li>• **Filtered data:** Only {filteredCommits.length} most relevant commits</li>
                  <li>• **Structured format:** Easy for LLMs to parse and analyze</li>
                  <li>• **Ready to paste:** Into ChatGPT, Claude, or any AI assistant</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedCommitExporter;
