import { Button } from "@/components/ui/button";
import googleLogo from "@/assets/googleLogo.svg";
import { Typograph } from "@/components/components/Typograph/Typograph";

interface SocialLoginButtonProps {
  className?: string;
}

export function ButtonSocialLogin({ className }: SocialLoginButtonProps) {
  const handleClick = () => {
    window.location.href = "/chat";
  };

  return (
    <Button
      onClick={handleClick}
      className={`flex items-center justify-center w-[341px] h-[64px] bg-white text-black border border-gray-300 hover:bg-gray-100 ${className}`}
    >
      <img src={googleLogo} alt="Google Logo" className="w-6 h-6" />
      <Typograph
        text="Entrar com o Google"
        colorText="text-inherit"
        variant="text4"
        weight="medium"
        fontFamily="poppins"
      />
    </Button>
  );
}
