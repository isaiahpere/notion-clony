"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { useUser } from "@clerk/clerk-react";

import { api } from "@/convex/_generated/api";

import { Button } from "@/components/ui/button";

const DocumentsPage = () => {
  const { user } = useUser();
  const router = useRouter();
  const create = useMutation(api.documents.create);

  // Create New Document
  const onCreate = () => {
    const promise = create({ title: "Untitled" }).then((docmentId) =>
      router.push(`/documents/${docmentId}`)
    );

    toast.promise(promise, {
      loading: "Creating a new note...",
      success: "New Note Created!",
      error: "Failed to create a new note.",
    });
  };

  return (
    <div className="h-full flex flex-col items-center justify-center space-y-4">
      <Image
        src="/empty.png"
        width={300}
        height={300}
        alt="empty"
        priority
        className="dark:hidden"
      />
      <Image
        src="/empty-dark.png"
        width={300}
        height={300}
        alt="empty"
        className="hidden dark:block"
      />
      <h2 className="text-lg font-medium">
        Welcome to {user?.username}&apos;s Notie
      </h2>
      <Button onClick={onCreate} className="cursor-pointer">
        <PlusCircle className="h-4 w-4 mr-2" />
        Create a Note
      </Button>
    </div>
  );
};

export default DocumentsPage;
