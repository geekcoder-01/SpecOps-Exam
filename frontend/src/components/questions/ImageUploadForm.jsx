export default function ImageUploadForm({
  questionType,
}) {
  const isImage = questionType === "image_upload";

  return (
    <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5">
      <h3 className="font-bold text-blue-200">
        {isImage
          ? "Student Image Upload"
          : "Student File Upload"}
      </h3>

      <p className="mt-2 text-sm text-blue-100/70">
        {isImage
          ? "Students will upload JPG, JPEG, PNG, or WEBP images as their answer."
          : "Students will upload a document or compressed file as their answer."}
      </p>

      <p className="mt-3 text-xs text-slate-400">
        File size and accepted-format settings will be added when the
        answer upload module is implemented.
      </p>
    </div>
  );
}