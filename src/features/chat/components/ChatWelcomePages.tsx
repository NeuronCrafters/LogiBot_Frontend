import { MessageSquare, Lock, Info } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Typograph } from "@/shared/components/Typography";

export const NonStudentWelcome: React.FC<{ userRoles: string[] }> = ({
  userRoles,
}) => {
  return (
    <div className="flex-1 w-full max-w-2xl px-4 pt-32 pb-40 mx-auto">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full shadow-lg bg-gradient-to-r from-violet-500 to-purple-600">
          <MessageSquare size={32} className="text-white" />
        </div>
        <Typograph
          text="Welcome to LogiBot Chat"
          colorText="text-white"
          variant="text1"
          weight="bold"
          fontFamily="poppins"
          className="mb-4"
        />
        <Typograph
          text="Our educational chat is a tool exclusively for students."
          colorText="text-gray-400"
          variant="text6"
          weight="regular"
          fontFamily="poppins"
        />
      </div>

      <div className="bg-[#1f1f1f] rounded-lg p-6 mb-8 border border-neutral-800 shadow-lg">
        <div className="flex items-start gap-4 mb-4">
          <Lock className="mt-1 text-purple-500" size={24} />
          <div>
            <Typograph
              text="Restricted Access"
              colorText="text-white"
              variant="text6"
              weight="bold"
              fontFamily="poppins"
              className="mb-2"
            />
            <Typograph
              text="This area is exclusive to students. The chat lets you ask questions, do exercises and practice content through interactive quizzes."
              colorText="text-gray-400"
              variant="text7"
              weight="regular"
              fontFamily="poppins"
            />
          </div>
        </div>

        <Alert className="bg-[#2a2a2a] border-purple-600 mt-4">
          <Info className="w-5 h-5 text-purple-500" />
          <AlertTitle className="text-white">
            <Typograph
              text="You do not have access to this area"
              colorText="text-white"
              variant="text6"
              weight="bold"
              fontFamily="poppins"
            />
          </AlertTitle>
          <AlertDescription className="text-gray-400">
            <Typograph
              text={`Your current profile (${userRoles.join(", ")}) does not have permission to access the chat feature. Contact the administrator if you need access.`}
              colorText="text-gray-400"
              variant="text7"
              weight="regular"
              fontFamily="poppins"
            />
          </AlertDescription>
        </Alert>
      </div>
      <div className="text-center" />
    </div>
  );
};

export const AdminWelcome: React.FC = () => {
  return (
    <div className="flex-1 w-full max-w-2xl px-4 pt-32 pb-40 mx-auto">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full shadow-lg bg-gradient-to-r from-fuchsia-500 to-orange-600">
          <Lock size={32} className="text-white" />
        </div>
        <Typograph
          text="Exclusive Chat"
          colorText="text-white"
          variant="text1"
          weight="bold"
          fontFamily="poppins"
          className="mb-4"
        />
        <Typograph
          text="As an administrator, you have access to different system features."
          colorText="text-gray-400"
          variant="text6"
          weight="regular"
          fontFamily="poppins"
        />
      </div>

      <div className="bg-[#1f1f1f] rounded-lg p-6 mb-8 border border-neutral-800 shadow-lg">
        <div className="flex items-start gap-4 mb-4">
          <Info className="mt-1 text-fuchsia-400" size={24} />
          <div>
            <Typograph
              text="Chat Exclusive to Students"
              colorText="text-white"
              variant="text6"
              weight="bold"
              fontFamily="poppins"
              className="mb-2"
            />
            <Typograph
              text="The chat feature was designed exclusively for students, allowing them to practice their knowledge through quizzes and ask questions."
              colorText="text-gray-400"
              variant="text7"
              weight="regular"
              fontFamily="poppins"
            />
          </div>
        </div>

        <div className="p-[2px] rounded-lg bg-gradient-to-r from-fuchsia-500 to-orange-600">
          <Alert className="bg-[#2a2a2a] rounded-lg">
            <Info className="w-5 h-5 text-fuchsia-400" />
            <AlertTitle className="text-white">
              <Typograph
                text="Administrator Permission"
                colorText="text-white"
                variant="text6"
                weight="bold"
                fontFamily="poppins"
              />
            </AlertTitle>
            <AlertDescription className="text-gray-400">
              <Typograph
                text="As an administrator, you have access to the system management features, such as content creation, report viewing and general settings. To manage these, use the other sections of the administrative menu."
                colorText="text-gray-400"
                variant="text7"
                weight="regular"
                fontFamily="poppins"
              />
            </AlertDescription>
          </Alert>
        </div>
      </div>
      <div className="text-center" />
    </div>
  );
};
