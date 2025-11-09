import { Loader2 } from "lucide-react";

export const LoadingSpinner = ({ size = "default" }: { size?: "sm" | "default" | "lg" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    default: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className={`${sizeClasses[size]} animate-spin`} />
    </div>
  );
};