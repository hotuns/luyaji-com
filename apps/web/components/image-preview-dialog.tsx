"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent } from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

type ImagePreviewDialogProps = {
	open: boolean;
	images: string[];
	initialIndex?: number;
	onOpenChange: (open: boolean) => void;
	title?: string;
};

export function ImagePreviewDialog({
	open,
	images,
	initialIndex = 0,
	onOpenChange,
	title = "图片预览",
}: ImagePreviewDialogProps) {
	const [currentIndex, setCurrentIndex] = useState(initialIndex);

	useEffect(() => {
		if (open) {
			setCurrentIndex(initialIndex);
		}
	}, [initialIndex, open]);

	if (!images || images.length === 0) return null;

	const showNav = images.length > 1;

	const handlePrev = () => {
		setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
	};

	const handleNext = () => {
		setCurrentIndex((prev) => (prev + 1) % images.length);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-5xl w-[95vw] bg-transparent border-none shadow-none p-0">
				<div className="relative bg-black rounded-2xl overflow-hidden">
					<div className="absolute top-3 right-3 z-20">
						<Button
							type="button"
							variant="secondary"
							size="icon"
							className="rounded-full bg-black/60 border border-white/20 text-white hover:bg-black/80"
							onClick={() => onOpenChange(false)}
						>
							<X className="w-4 h-4" />
						</Button>
					</div>

					<div className="px-4 pt-6 pb-3 text-center text-white/80 text-sm">
						{title}
					</div>

					<div className="relative flex items-center justify-center bg-black">
						<div className="relative w-full min-h-[40vh] max-h-[80vh] flex items-center justify-center">
							<Image
								src={images[currentIndex] ?? ""}
								alt={`${title} ${currentIndex + 1}`}
								fill
								className="object-contain"
								sizes="100vw"
								priority
							/>
						</div>

						{showNav && (
							<>
								<button
									type="button"
									className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 text-white hover:bg-black/70"
									onClick={handlePrev}
								>
									<ChevronLeft className="w-5 h-5" />
								</button>
								<button
									type="button"
									className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 text-white hover:bg-black/70"
									onClick={handleNext}
								>
									<ChevronRight className="w-5 h-5" />
								</button>
							</>
						)}
					</div>

					{showNav && (
						<div className="flex items-center justify-center gap-2 py-3">
							{images.map((url, index) => (
								<span
									key={`${url}-${index}`}
									className={cn(
										"h-1.5 rounded-full transition-all duration-150",
										currentIndex === index
											? "w-6 bg-white"
											: "w-3 bg-white/40",
									)}
								/>
							))}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
