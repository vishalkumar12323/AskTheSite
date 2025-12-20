import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Home() {
  return (
    <main className="w-full h-screen flex justify-center items-center">
      <div className="card w-full mx-auto max-w-1/2 shadow-lg rounded-md p-4 border bg-gray-50 flex flex-col gap-3">
        <Input placeholder="www.example.com" />
        <Textarea placeholder="Ask about website..." />
        <Button variant={"default"}>Submit</Button>
      </div>
    </main>
  );
}
