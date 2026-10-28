import { useState } from "react";
import { X, Save, KeyRound, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typograph } from "@/shared/components/Typography";

interface EditPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (currentPass: string, newPass: string) => Promise<void>;
}

export function EditPasswordModal({
  isOpen,
  onClose,
  onSave,
}: EditPasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("The new password must be at least 6 characters long.");
      return;
    }
    try {
      setIsLoading(true);
      await onSave(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onClose();
    } catch (err) {
      setError("Failed to change password. Check your current password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#1f1f1f] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <KeyRound size={18} className="text-orange-400" />
                <Typograph
                  text="Change Password"
                  colorText="text-white"
                  variant="text4"
                  weight="semibold"
                  fontFamily="poppins"
                />
              </div>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="text-zinc-400 hover:text-white disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                    Current Password
                  </label>
                  <PasswordInput
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    show={showPassword}
                    placeholder="Enter your current password"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                    New Password
                  </label>
                  <PasswordInput
                    value={newPassword}
                    onChange={setNewPassword}
                    show={showPassword}
                    placeholder="Enter the new password"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                    Confirm New Password
                  </label>
                  <PasswordInput
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    show={showPassword}
                    placeholder="Confirm the new password"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mt-2"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                {showPassword ? "Hide passwords" : "Show passwords"}
              </button>
            </div>
            <div className="p-4 border-t border-zinc-800 flex justify-end gap-2 bg-[#1a1a1a]">
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={isLoading}
                className="text-zinc-400 hover:bg-red-600 hover:text-white transition-colors"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-orange-600 hover:bg-orange-700 text-white gap-2 min-w-[100px]"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PasswordInput({
  value,
  onChange,
  show,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  placeholder: string;
}) {
  return (
    <input
      type={show ? "text" : "password"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-[#141414] border border-zinc-700 rounded-lg p-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors text-sm"
    />
  );
}
