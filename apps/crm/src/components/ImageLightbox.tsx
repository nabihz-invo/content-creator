import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import type { KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";

export interface LightboxItem {
  src: string;
  title: string;
}

/** Images at full size, with previous/next (buttons and arrow keys, following the reading direction). */
export function ImageLightbox({
  items,
  index,
  onIndex,
  onClose,
}: {
  items: LightboxItem[];
  index: number | null;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const { t, dir } = useI18n();
  const item = index === null ? undefined : items[index];
  const step = (by: number) =>
    index !== null && onIndex((index + by + items.length) % items.length);
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    step((e.key === "ArrowRight") === (dir === "ltr") ? 1 : -1);
  };
  const Prev = dir === "rtl" ? ChevronRight : ChevronLeft;
  const Next = dir === "rtl" ? ChevronLeft : ChevronRight;
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        dir={dir}
        closeLabel={t("common.close")}
        className="max-w-3xl gap-3 p-4"
        onKeyDown={onKeyDown}
      >
        <DialogHeader className="pe-8">
          <DialogTitle className="text-sm" dir="ltr">
            {item?.title}
          </DialogTitle>
          {items.length > 1 && index !== null && (
            <DialogDescription className="text-xs">
              {t("finished.counter", { i: index + 1, n: items.length })}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="flex max-h-[75dvh] items-center justify-center overflow-hidden rounded-md bg-black/90">
          {item && (
            <img src={item.src} alt={item.title} className="max-h-[75dvh] w-auto object-contain" />
          )}
        </div>
        <DialogFooter className="items-center sm:justify-between">
          <div className="flex gap-2">
            {items.length > 1 && (
              <>
                <Button size="sm" variant="outline" onClick={() => step(-1)}>
                  <Prev />
                  {t("finished.prev")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => step(1)}>
                  {t("finished.next")}
                  <Next />
                </Button>
              </>
            )}
          </div>
          {item && (
            <Button size="sm" variant="ghost" asChild>
              <a href={item.src} target="_blank" rel="noopener noreferrer">
                <ExternalLink />
                {t("finished.openNew")}
              </a>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
