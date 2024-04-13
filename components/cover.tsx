"use client";

import Image from "next/image";
import { ImageIcon, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCoverImage } from "@/hooks/use-cover-image";
import { Id } from "@/convex/_generated/dataModel";

import { cn } from "@/lib/utils";
import { useEdgeStore } from "@/lib/edgestore";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface CoverImageProps {
  url?: string;
  preview?: boolean;
}

export const Cover = ({ url, preview }: CoverImageProps) => {
  const params = useParams();

  const coverImage = useCoverImage();
  const removeCoverImage = useMutation(api.documents.removeCoverImage);
  const { edgestore } = useEdgeStore();

  const onRemove = async () => {
    if (url) {
      await edgestore.publicFiles.delete({
        url: url,
      });
    }
    removeCoverImage({ id: params.documentId as Id<"documents"> });
  };

  return (
    <div
      className={cn(
        "relative w-full h-[35vh] group",
        !url && "h-[12vh]",
        url && "bg-muted"
      )}
    >
      {!!url && <Image src={url} fill alt="cover" className="object-cover" />}
      {url && !preview && (
        <div className="opacity-0 group-hover:opacity-100 absolute bottom-5 right-5 flex items-center gap-x-2">
          <Button
            onClick={() => coverImage.onReplace(url)}
            className="text-muted-foreground text-xs"
            variant={"outline"}
            size={"sm"}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Change Cover
          </Button>
          <Button
            onClick={onRemove}
            className="text-muted-foreground text-xs"
            variant={"outline"}
            size={"sm"}
          >
            <X className="w-4 h-4 mr-2" />
            Remove
          </Button>
        </div>
      )}
    </div>
  );
};

Cover.Skeleton = function CoverSkeleton() {
  return <Skeleton className="w-full h-[12vh]" />;
};
