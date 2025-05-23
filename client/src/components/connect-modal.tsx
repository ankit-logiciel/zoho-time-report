import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (credentials: ZohoCredentials) => Promise<void>;
}

export interface ZohoCredentials {
  clientId: string;
  clientSecret: string;
  organization: string;
}

export default function ConnectModal({ isOpen, onClose, onConnect }: ConnectModalProps) {
  const [credentials, setCredentials] = useState<ZohoCredentials>({
    clientId: "",
    clientSecret: "",
    organization: ""
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.clientId || !credentials.clientSecret || !credentials.organization) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields to connect to Zoho People.",
        variant: "destructive"
      });
      return;
    }
    
    setIsConnecting(true);
    
    try {
      await onConnect(credentials);
      toast({
        title: "Connection Successful",
        description: "Successfully connected to Zoho People API.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to Zoho People API.",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
              <LinkIcon className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center pt-2">Connect to Zoho People</DialogTitle>
            <DialogDescription className="text-center">
              To access your timesheet data, we need to connect to your Zoho People account. Please provide your API credentials below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                name="clientId"
                value={credentials.clientId}
                onChange={handleChange}
                placeholder="Enter your Zoho API client ID"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret</Label>
              <Input
                id="clientSecret"
                name="clientSecret"
                type="password"
                value={credentials.clientSecret}
                onChange={handleChange}
                placeholder="Enter your Zoho API client secret"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="organization">Organization Name</Label>
              <div className="flex rounded-md">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                  https://
                </span>
                <Input
                  id="organization"
                  name="organization"
                  value={credentials.organization}
                  onChange={handleChange}
                  className="rounded-l-none"
                  placeholder="yourcompany"
                />
                <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-input bg-muted text-muted-foreground text-sm">
                  .zoho.com
                </span>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isConnecting}>
              {isConnecting ? "Connecting..." : "Connect"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
