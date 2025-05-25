
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface CommitExporterProps {
  commits: any[];
  username: string;
  repository: string;
  dateRange: { from: Date; to: Date };
}

const CommitExporter = ({ commits, username, repository, dateRange }: CommitExporterProps) => {
  const [exportedText, setExportedText] = useState("");
  const { toast } = useToast();

  const generateLLMFormat = () => {
    const header = `# GitHub Commit History Analysis

**Repository:** ${username}/${repository}
**Date Range:** ${format(dateRange.from, 'yyyy-MM-dd')} to ${format(dateRange.to, 'yyyy-MM-dd')}
**Total Commits:** ${commits.length}
**Generated:** ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}

---

## Commit Details

`;

    const commitDetails = commits.map((commit, index) => {
      const date = new Date(commit.commit.author.date);
      const message = commit.commit.message.split('\n');
      const title = message[0];
      const body = message.slice(1).join('\n').trim();

      return `### Commit ${index + 1}

**SHA:** ${commit.sha}
**Date:** ${format(date, 'yyyy-MM-dd HH:mm:ss')}
**Author:** ${commit.commit.author.name} <${commit.commit.author.email}>
**Message:** ${title}
${body ? `**Description:**\n${body}\n` : ''}
**URL:** ${commit.html_url}

---
`;
    }).join('\n');

    const summary = `
## Summary Statistics

- **Total commits:** ${commits.length}
- **Date range:** ${format(dateRange.from, 'yyyy-MM-dd')} to ${format(dateRange.to, 'yyyy-MM-dd')}
- **Repository:** ${username}/${repository}
- **Authors:** ${[...new Set(commits.map(c => c.commit.author.name))].length} unique author(s)
- **Average commits per day:** ${(commits.length / Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))).toFixed(2)}

## Author Breakdown

${[...new Set(commits.map(c => c.commit.author.name))].map(author => {
  const authorCommits = commits.filter(c => c.commit.author.name === author);
  return `- **${author}:** ${authorCommits.length} commits`;
}).join('\n')}

---

*This data is formatted for LLM analysis. You can ask questions about commit patterns, development velocity, code changes, author contributions, and more.*`;

    const fullText = header + commitDetails + summary;
    setExportedText(fullText);
    
    toast({
      title: "Export generated",
      description: "LLM-friendly format has been generated successfully",
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(exportedText);
      toast({
        title: "Copied to clipboard",
        description: "The formatted commit data has been copied to your clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard. Please copy manually.",
        variant: "destructive",
      });
    }
  };

  const downloadAsFile = () => {
    const blob = new Blob([exportedText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${username}-${repository}-commits-${format(dateRange.from, 'yyyy-MM-dd')}-to-${format(dateRange.to, 'yyyy-MM-dd')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "File downloaded",
      description: "Commit data has been saved as a Markdown file",
    });
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Commit Export Results
        </CardTitle>
        <CardDescription className="text-gray-400">
          Found {commits.length} commits. Generate LLM-friendly format for analysis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary" className="bg-green-600 text-white">
            {commits.length} commits
          </Badge>
          <Badge variant="outline" className="border-gray-600 text-gray-300">
            {[...new Set(commits.map(c => c.commit.author.name))].length} authors
          </Badge>
          <Badge variant="outline" className="border-gray-600 text-gray-300">
            {format(dateRange.from, 'MMM dd')} - {format(dateRange.to, 'MMM dd, yyyy')}
          </Badge>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={generateLLMFormat}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate LLM-Friendly Format
          </Button>

          {exportedText && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">
                  Generated Content (Ready for LLM Analysis)
                </label>
                <Textarea
                  value={exportedText}
                  readOnly
                  className="min-h-[300px] bg-gray-700 border-gray-600 text-white font-mono text-sm"
                  placeholder="Generated content will appear here..."
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={copyToClipboard}
                  variant="outline" 
                  className="flex-1 border-gray-600 text-gray-200 hover:bg-gray-700"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to Clipboard
                </Button>
                <Button 
                  onClick={downloadAsFile}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-200 hover:bg-gray-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download as .md
                </Button>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="text-white font-medium mb-2">💡 How to use with LLMs:</h4>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Copy the generated text and paste it into ChatGPT, Claude, or any LLM</li>
                  <li>• Ask questions like "What are the main development patterns?" or "Summarize the work done"</li>
                  <li>• Analyze commit frequency, author contributions, and development velocity</li>
                  <li>• Get insights on code changes and project evolution</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CommitExporter;
