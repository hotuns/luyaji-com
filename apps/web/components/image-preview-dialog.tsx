"use client";

import { useEffect, useState } from "react";
import { Image } from "antd";

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

	return (
		<div className="hidden">
			<Image.PreviewGroup
				preview={{
					visible: open,
					current: currentIndex,
					onVisibleChange: (visible) => {
						if (!visible) {
							onOpenChange(false);
						}
					},
					onChange: (current) => {
						setCurrentIndex(current);
					},
				}}
			>
				{images.map((src, index) => (
					<Image
						key={`${src}-${index}`}
						src={src}
						alt={`${title} ${index + 1}`}
						wrapperClassName="hidden"
						style={{ display: "none" }}
					/>
				))}
			</Image.PreviewGroup>
		</div>
	);
}
