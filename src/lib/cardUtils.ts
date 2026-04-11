export async function splitCardImage(
  base64: string,
): Promise<{ front: string; back: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const halfWidth = Math.floor(img.width / 2);

      function cropAndRotate(offsetX: number): string {
        const temp = document.createElement("canvas");
        temp.width = halfWidth;
        temp.height = img.height;
        temp.getContext("2d")!.drawImage(img, -offsetX, 0);

        const rotated = document.createElement("canvas");
        rotated.width = img.height;
        rotated.height = halfWidth;
        const ctx = rotated.getContext("2d")!;
        ctx.translate(img.height / 2, halfWidth / 2);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(temp, -halfWidth / 2, -img.height / 2);

        return rotated.toDataURL("image/jpeg", 0.95);
      }

      resolve({
        front: cropAndRotate(0),
        back: cropAndRotate(halfWidth),
      });
    };
    img.src = `data:image/jpeg;base64,${base64}`;
  });
}