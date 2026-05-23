"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, MessageSquare, Stamp, UploadCloud } from "lucide-react";
import { type MouseEvent, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Field, Label, Textarea } from "./ui/form";

export type CaseFileView = {
  id: string;
  kind: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  virusScanStatus: string;
  phiScanStatus: string;
  uploadedAt: string | Date;
};

type PreviewMetadata = {
  status: "pending" | "ready" | "failed";
  pageCount: number | null;
  previewMimeType: string | null;
  errorCode: string | null;
  generatedAt: string | Date | null;
};

type CaseFileAnnotation = {
  id: string;
  caseFileId: string;
  authorUserId: string;
  pageNumber: number;
  xPct: string | number;
  yPct: string | number;
  widthPct: string | number;
  heightPct: string | number;
  body: string;
  status: "active" | "resolved";
  createdAt: string | Date;
};

type PreviewAsset = {
  url: string | null;
  text: string | null;
  error: string | null;
};

type AnnotationTarget = {
  pageNumber: number;
  xPct: number;
  yPct: number;
};

type FileAction = {
  kind: "revision" | "stamp";
  fileId: string;
  filename: string;
};

const fileFormSchema = z.object({
  kind: z.enum([
    "report_draft",
    "test_result",
    "scoring_sheet",
    "response_sheet",
    "behavioral_observation",
    "interview_summary",
    "other",
    "direct_edit_revision"
  ]),
  file: z.custom<FileList>((value) => isFileList(value) && value.length === 1, {
    message: "업로드할 파일을 하나 선택해 주세요."
  })
});

type FileFormValues = z.infer<typeof fileFormSchema>;

export function CaseFilesPanel({
  requestId,
  initialFiles,
  canUpload,
  canDelete,
  canAnnotate = false,
  canRequestRevision = false,
  canStampReturn = false
}: {
  requestId: string;
  initialFiles: CaseFileView[];
  canUpload: boolean;
  canDelete: boolean;
  canAnnotate?: boolean;
  canRequestRevision?: boolean;
  canStampReturn?: boolean;
}) {
  const [files, setFiles] = useState(initialFiles);
  const [busy, setBusy] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState(initialFiles[0]?.id ?? "");
  const [previews, setPreviews] = useState<Record<string, PreviewMetadata>>({});
  const [previewAssets, setPreviewAssets] = useState<Record<string, PreviewAsset>>({});
  const [annotations, setAnnotations] = useState<Record<string, CaseFileAnnotation[]>>(
    {}
  );
  const [annotationTarget, setAnnotationTarget] = useState<AnnotationTarget | null>(
    null
  );
  const [annotationPage, setAnnotationPage] = useState(1);
  const [annotationBody, setAnnotationBody] = useState("");
  const [fileAction, setFileAction] = useState<FileAction | null>(null);
  const [fileActionNote, setFileActionNote] = useState("");
  const [fileActionBusy, setFileActionBusy] = useState(false);
  const form = useForm<FileFormValues>({
    resolver: zodResolver(fileFormSchema),
    defaultValues: { kind: "report_draft" }
  });

  async function upload(values: FileFormValues) {
    const file = values.file.item(0);
    if (!file) return;
    setBusy(true);
    try {
      const preparedResponse = await fetch("/api/case-files/upload-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          requestId,
          filename: file.name,
          contentType: file.type,
          sizeBytes: file.size,
          kind: values.kind
        })
      });
      const prepared = (await preparedResponse.json()) as {
        data?: { url: string; uploadKey: string; contentType: string };
        error?: { code: string };
      };
      if (!preparedResponse.ok || !prepared.data) {
        throw new Error(prepared.error?.code ?? "upload_prepare_failed");
      }

      const uploadResponse = await fetch(prepared.data.url, {
        method: "PUT",
        headers: { "content-type": prepared.data.contentType },
        body: file
      });
      if (!uploadResponse.ok) throw new Error("upload_failed");

      const registerResponse = await fetch("/api/case-files", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          requestId,
          uploadKey: prepared.data.uploadKey,
          kind: values.kind,
          originalFilename: file.name,
          mimeType: prepared.data.contentType,
          sizeBytes: file.size
        })
      });
      const registered = (await registerResponse.json()) as {
        data?: { file: CaseFileView };
        error?: { code: string };
      };
      if (!registerResponse.ok || !registered.data) {
        throw new Error(registered.error?.code ?? "file_register_failed");
      }

      const registeredFile = registered.data.file;
      setFiles((current) => [registeredFile, ...current]);
      form.reset({ kind: "report_draft" });
      toast.success("파일이 등록되었습니다.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "파일 업로드 실패");
    } finally {
      setBusy(false);
    }
  }

  async function download(fileId: string) {
    const response = await fetch(`/api/case-files/${fileId}/download-url`);
    const body = (await response.json()) as {
      data?: { download: { url: string } };
      error?: { code: string };
    };
    if (!response.ok || !body.data) {
      toast.error(body.error?.code ?? "다운로드 준비 실패");
      return;
    }
    window.location.href = body.data.download.url;
  }

  async function deleteFile(fileId: string) {
    const response = await fetch(`/api/case-files/${fileId}`, { method: "DELETE" });
    if (!response.ok) {
      const body = (await response.json()) as { error?: { code: string } };
      toast.error(body.error?.code ?? "삭제 실패");
      return;
    }
    setFiles((current) => current.filter((file) => file.id !== fileId));
    toast.success("파일을 삭제했습니다.");
  }

  async function openWorkspace(fileId: string) {
    setSelectedFileId(fileId);
    const file = files.find((currentFile) => currentFile.id === fileId);
    setAnnotationTarget(null);
    setAnnotationPage(1);
    await Promise.all([
      loadPreview(fileId),
      loadAnnotations(fileId),
      file ? loadPreviewAsset(file) : Promise.resolve()
    ]);
  }

  async function loadPreview(fileId: string) {
    const response = await fetch(`/api/case-files/${fileId}/preview`);
    const body = (await response.json()) as {
      data?: { preview: PreviewMetadata };
      error?: { code: string };
    };
    if (!response.ok || !body.data) {
      toast.error(body.error?.code ?? "미리보기 정보를 불러오지 못했습니다.");
      return;
    }
    const preview = body.data.preview;
    setPreviews((current) => ({ ...current, [fileId]: preview }));
    toast.success("미리보기 상태를 확인했습니다.");
  }

  async function loadPreviewAsset(file: CaseFileView) {
    const existing = previewAssets[file.id];
    if (existing?.url || existing?.text) return;
    const isRenderable =
      file.mimeType === "application/pdf" ||
      file.mimeType.startsWith("image/") ||
      file.mimeType.startsWith("text/") ||
      file.mimeType === "application/json";
    if (!isRenderable) {
      setPreviewAssets((current) => ({
        ...current,
        [file.id]: {
          error: "이 파일 형식은 내부 변환이 준비된 뒤 미리볼 수 있습니다.",
          text: null,
          url: null
        }
      }));
      return;
    }

    const response = await fetch(`/api/case-files/${file.id}/download-url`);
    const body = (await response.json()) as {
      data?: { download: { url: string } };
      error?: { code: string };
    };
    if (!response.ok || !body.data) {
      setPreviewAssets((current) => ({
        ...current,
        [file.id]: {
          error: body.error?.code ?? "미리보기 파일을 불러오지 못했습니다.",
          text: null,
          url: null
        }
      }));
      return;
    }

    const url = body.data.download.url;
    if (file.mimeType.startsWith("text/") || file.mimeType === "application/json") {
      const textResponse = await fetch(url);
      const text = textResponse.ok
        ? await textResponse.text()
        : "텍스트 미리보기를 불러오지 못했습니다.";
      setPreviewAssets((current) => ({
        ...current,
        [file.id]: { error: null, text, url }
      }));
      return;
    }

    setPreviewAssets((current) => ({
      ...current,
      [file.id]: { error: null, text: null, url }
    }));
  }

  async function loadAnnotations(fileId: string) {
    const response = await fetch(`/api/case-files/${fileId}/annotations`);
    const body = (await response.json()) as {
      data?: { annotations: CaseFileAnnotation[] };
      error?: { code: string };
    };
    if (!response.ok || !body.data) {
      toast.error(body.error?.code ?? "주석을 불러오지 못했습니다.");
      return;
    }
    setAnnotations((current) => ({
      ...current,
      [fileId]: body.data?.annotations ?? []
    }));
  }

  async function addAnnotation(fileId: string) {
    const bodyText = annotationBody.trim();
    if (!bodyText) {
      toast.error("주석 내용을 입력해주세요.");
      return;
    }
    if (!annotationTarget) {
      toast.error("미리보기 영역에서 주석을 남길 위치를 먼저 클릭해주세요.");
      return;
    }
    const response = await fetch(`/api/case-files/${fileId}/annotations`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        pageNumber: annotationTarget.pageNumber,
        xPct: annotationTarget.xPct,
        yPct: annotationTarget.yPct,
        widthPct: 24,
        heightPct: 12,
        body: bodyText
      })
    });
    if (!response.ok) {
      const body = (await response.json()) as { error?: { code: string } };
      toast.error(body.error?.code ?? "주석 추가 실패");
      return;
    }
    setAnnotationBody("");
    setAnnotationTarget(null);
    await loadAnnotations(fileId);
    toast.success("주석을 추가했습니다.");
  }

  function selectAnnotationTarget(event: MouseEvent<HTMLElement>) {
    if (!canAnnotate) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const xPct = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
    const yPct = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100);
    setAnnotationTarget({
      pageNumber: annotationPage,
      xPct: roundPct(xPct),
      yPct: roundPct(yPct)
    });
  }

  function openFileAction(kind: FileAction["kind"], file: CaseFileView) {
    setFileAction({
      fileId: file.id,
      filename: file.originalFilename,
      kind
    });
    setFileActionNote("");
  }

  async function submitFileAction() {
    if (!fileAction) return;
    const note = fileActionNote.trim();
    if (note.length < 10) {
      toast.error(
        fileAction.kind === "revision"
          ? "보완 요청 사유를 10자 이상 입력해주세요."
          : "검토 메모를 10자 이상 입력해주세요."
      );
      return;
    }

    setFileActionBusy(true);
    const endpoint = fileAction.kind === "revision" ? "revision-request" : "stamp";
    const response = await fetch(`/api/supervision-requests/${requestId}/${endpoint}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        targetFileId: fileAction.fileId,
        note
      })
    });
    setFileActionBusy(false);
    if (!response.ok) {
      const body = (await response.json()) as { error?: { code: string } };
      toast.error(
        body.error?.code ??
          (fileAction.kind === "revision" ? "수정 요청 실패" : "스탬프 기록 실패")
      );
      return;
    }
    setFileAction(null);
    setFileActionNote("");
    toast.success(
      fileAction.kind === "revision"
        ? "수정 요청을 기록했습니다."
        : "검토 확인을 기록했습니다."
    );
  }

  const selectedFile = files.find((file) => file.id === selectedFileId) ?? files[0];
  const selectedPreview = selectedFile ? previews[selectedFile.id] : null;
  const selectedPreviewAsset = selectedFile ? previewAssets[selectedFile.id] : null;
  const selectedAnnotations = selectedFile ? (annotations[selectedFile.id] ?? []) : [];
  const selectedPageCount = Math.max(selectedPreview?.pageCount ?? 1, 1);

  return (
    <Card className="grid gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">첨부 파일</h2>
          <p className="text-sm text-ink-500">
            PDF, 이미지, HWP/HWPX, DOCX, XLSX, TXT, Markdown, JSON, CSV 자료를 업로드할
            수 있습니다. 실행파일과 압축파일 같은 위험 형식은 차단되며, 미리보기 변환은
            지원 형식부터 단계적으로 제공됩니다.
          </p>
        </div>
        <Badge tone="accent">{files.length}개</Badge>
      </div>

      {canUpload ? (
        <form className="grid gap-3" onSubmit={form.handleSubmit(upload)}>
          <div className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
            <select
              className="h-11 rounded-md border border-line bg-surface-elevated px-3"
              {...form.register("kind")}
            >
              <option value="report_draft">보고서 초안</option>
              <option value="test_result">검사 결과</option>
              <option value="scoring_sheet">채점표</option>
              <option value="response_sheet">반응지</option>
              <option value="behavioral_observation">행동관찰</option>
              <option value="interview_summary">면담 요약</option>
              <option value="direct_edit_revision">직접 수정본</option>
              <option value="other">기타</option>
            </select>
            <Field>
              <Label className="sr-only" htmlFor="case-file">
                파일 선택
              </Label>
              <input
                className="h-11 w-full rounded-md border border-line bg-surface-elevated px-3 py-2 text-sm"
                id="case-file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.hwp,.hwpx,.docx,.xlsx,.txt,.md,.markdown,.json,.csv,application/pdf,image/png,image/jpeg,image/webp,application/x-hwp,application/haansofthwp,application/vnd.hancom.hwp,application/haansofthwpx,application/vnd.hancom.hwpx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/markdown,application/json,text/csv"
                type="file"
                {...form.register("file")}
              />
              {form.formState.errors.file ? (
                <p className="text-sm text-danger" role="alert">
                  {form.formState.errors.file.message}
                </p>
              ) : null}
            </Field>
            <Button disabled={busy} type="submit">
              <UploadCloud aria-hidden size={16} />
              업로드
            </Button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-3">
        {files.length === 0 ? (
          <p className="rounded-md bg-surface-sunken p-4 text-sm text-ink-500">
            아직 첨부된 파일이 없습니다.
          </p>
        ) : (
          files.map((file) => (
            <div className="grid gap-3 rounded-md border border-line p-3" key={file.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{file.originalFilename}</p>
                  <p className="text-sm text-ink-500">
                    {fileKindLabel(file.kind)} · {formatBytes(file.sizeBytes)} ·
                    바이러스 {scanStatusLabel(file.virusScanStatus)} · 개인정보{" "}
                    {scanStatusLabel(file.phiScanStatus)}
                  </p>
                  {previews[file.id] ? (
                    <p className="mt-1 text-sm text-ink-500">
                      미리보기 {previewStatusLabel(previews[file.id]?.status)}
                      {previews[file.id]?.pageCount
                        ? ` · ${String(previews[file.id]?.pageCount)}쪽`
                        : ""}
                      {previews[file.id]?.errorCode
                        ? ` · ${previews[file.id]?.errorCode ?? ""}`
                        : ""}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => void openWorkspace(file.id)}
                    type="button"
                    variant="secondary"
                  >
                    <Eye aria-hidden size={16} />
                    미리보기
                  </Button>
                  <Button
                    onClick={() => void download(file.id)}
                    type="button"
                    variant="secondary"
                  >
                    다운로드
                  </Button>
                  {canAnnotate ? (
                    <Button
                      onClick={() => void openWorkspace(file.id)}
                      type="button"
                      variant="ghost"
                    >
                      <MessageSquare aria-hidden size={16} />
                      주석
                    </Button>
                  ) : null}
                  {canRequestRevision ? (
                    <Button
                      onClick={() => openFileAction("revision", file)}
                      type="button"
                      variant="ghost"
                    >
                      수정요청
                    </Button>
                  ) : null}
                  {canStampReturn ? (
                    <Button
                      onClick={() => openFileAction("stamp", file)}
                      type="button"
                      variant="ghost"
                    >
                      <Stamp aria-hidden size={16} />
                      스탬프
                    </Button>
                  ) : null}
                  {canDelete ? (
                    <Button
                      onClick={() => void deleteFile(file.id)}
                      type="button"
                      variant="ghost"
                    >
                      삭제
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {fileAction ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-ink-900/30 p-4"
          role="dialog"
        >
          <div className="w-full max-w-lg rounded-xl border border-line bg-surface-elevated p-5 shadow-xl">
            <div className="mb-4">
              <p className="text-sm font-semibold text-brand-700">
                {fileAction.kind === "revision" ? "보완 요청" : "검토 확인"}
              </p>
              <h3 className="mt-1 text-lg font-bold text-ink-900">
                {fileAction.filename}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                {fileAction.kind === "revision"
                  ? "슈퍼바이지에게 전달할 보완 사유를 직접 작성하세요. 이 메모는 파일과 함께 기록됩니다."
                  : "확인 표시와 함께 남길 검토 메모를 직접 작성하세요. 이 메모는 파일 검토 기록에 저장됩니다."}
              </p>
            </div>
            <Field>
              <Label htmlFor="file-action-note">
                {fileAction.kind === "revision" ? "보완 요청 사유" : "검토 메모"}
              </Label>
              <Textarea
                autoFocus
                id="file-action-note"
                onChange={(event) => setFileActionNote(event.currentTarget.value)}
                placeholder={
                  fileAction.kind === "revision"
                    ? "수정이 필요한 항목과 원하는 보완 방향을 적어주세요."
                    : "검토한 범위와 확인 내용을 적어주세요."
                }
                value={fileActionNote}
              />
              <p className="text-sm text-ink-500">
                최소 10자 이상 입력해야 저장할 수 있습니다.
              </p>
            </Field>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                onClick={() => {
                  setFileAction(null);
                  setFileActionNote("");
                }}
                type="button"
                variant="ghost"
              >
                취소
              </Button>
              <Button
                disabled={fileActionBusy}
                onClick={() => void submitFileAction()}
                type="button"
              >
                {fileAction.kind === "revision" ? "보완 요청 저장" : "검토 확인 저장"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedFile ? (
        <div className="grid gap-4 rounded-md border border-line bg-surface-base p-4 lg:grid-cols-[1fr_280px]">
          <div className="relative min-h-[360px] overflow-hidden rounded-lg border border-line bg-white">
            <div className="flex items-center justify-between border-b border-line bg-surface-sunken px-4 py-3">
              <div>
                <p className="font-semibold text-ink-900">
                  {selectedFile.originalFilename}
                </p>
                <p className="text-sm text-ink-500">
                  앱 내부 미리보기 · {previewStatusLabel(selectedPreview?.status)}
                </p>
              </div>
              <Button
                onClick={() => void openWorkspace(selectedFile.id)}
                type="button"
                variant="secondary"
              >
                새로고침
              </Button>
            </div>
            <div
              className={`relative min-h-[300px] overflow-hidden bg-surface-sunken ${
                canAnnotate ? "cursor-crosshair" : ""
              }`}
            >
              <PreviewContent
                asset={selectedPreviewAsset}
                file={selectedFile}
                preview={selectedPreview}
              />
              {canAnnotate ? (
                <button
                  aria-label="주석 위치 선택"
                  className="absolute inset-0 z-30 cursor-crosshair bg-transparent"
                  onClick={selectAnnotationTarget}
                  title="클릭한 위치에 주석 좌표가 저장됩니다."
                  type="button"
                />
              ) : null}
              <div className="pointer-events-none absolute inset-0 flex rotate-[-24deg] items-center justify-center text-center text-xl font-bold leading-relaxed text-ink-300 opacity-20">
                본 자료는 ClinicFlow에서 슈퍼비전 목적으로만 열람됩니다.
              </div>
              {selectedAnnotations
                .filter((annotation) => annotation.pageNumber === annotationPage)
                .map((annotation) => (
                  <AnnotationMarker
                    annotation={annotation}
                    key={annotation.id}
                    tone="saved"
                  />
                ))}
              {annotationTarget ? (
                <AnnotationMarker annotation={annotationTarget} tone="draft" />
              ) : null}
            </div>
          </div>
          <aside className="grid gap-3">
            <div>
              <h3 className="font-bold text-ink-900">페이지 주석</h3>
              <p className="mt-1 text-sm text-ink-500">
                미리보기 영역을 클릭한 뒤 주석을 저장합니다.
              </p>
            </div>
            {canAnnotate ? (
              <label className="grid gap-1 text-sm text-ink-700">
                <span className="font-semibold">주석 페이지</span>
                <input
                  className="h-10 rounded-md border border-line bg-surface-elevated px-3"
                  max={selectedPageCount}
                  min={1}
                  onChange={(event) => {
                    const nextPage = Number(event.currentTarget.value);
                    setAnnotationPage(
                      Number.isFinite(nextPage)
                        ? Math.min(Math.max(Math.trunc(nextPage), 1), selectedPageCount)
                        : 1
                    );
                    setAnnotationTarget(null);
                  }}
                  type="number"
                  value={annotationPage}
                />
              </label>
            ) : null}
            {annotationTarget ? (
              <p className="rounded-md bg-brand-50 p-3 text-sm text-brand-700">
                선택 위치: {annotationTarget.pageNumber}쪽 · x{" "}
                {annotationTarget.xPct.toFixed(1)}%, y{" "}
                {annotationTarget.yPct.toFixed(1)}%
              </p>
            ) : canAnnotate ? (
              <p className="rounded-md bg-surface-sunken p-3 text-sm text-ink-500">
                주석을 남길 위치를 미리보기에서 클릭하세요.
              </p>
            ) : null}
            <div className="grid max-h-52 gap-2 overflow-y-auto">
              {selectedAnnotations.length === 0 ? (
                <p className="rounded-md bg-surface-sunken p-3 text-sm text-ink-500">
                  아직 주석이 없습니다.
                </p>
              ) : (
                selectedAnnotations.map((annotation) => (
                  <div
                    className="rounded-md border border-line bg-surface-elevated p-3 text-sm"
                    key={annotation.id}
                  >
                    <p className="font-semibold text-ink-700">
                      {annotation.pageNumber}쪽 · x {formatPct(annotation.xPct)}%, y{" "}
                      {formatPct(annotation.yPct)}% ·{" "}
                      {annotationStatusLabel(annotation.status)}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-ink-900">
                      {annotation.body}
                    </p>
                  </div>
                ))
              )}
            </div>
            {canAnnotate ? (
              <div className="grid gap-2">
                <textarea
                  className="min-h-24 rounded-md border border-line bg-surface-elevated p-3 text-sm"
                  onChange={(event) => setAnnotationBody(event.currentTarget.value)}
                  placeholder="선택한 페이지에 남길 메모를 입력하세요."
                  value={annotationBody}
                />
                <Button
                  onClick={() => void addAnnotation(selectedFile.id)}
                  type="button"
                  variant="secondary"
                >
                  <MessageSquare aria-hidden size={16} />
                  주석 저장
                </Button>
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}
    </Card>
  );
}

function isFileList(value: unknown): value is FileList {
  return (
    typeof FileList !== "undefined" && value instanceof FileList && value.length > 0
  );
}

function PreviewContent({
  asset,
  file,
  preview
}: {
  asset: PreviewAsset | null | undefined;
  file: CaseFileView;
  preview: PreviewMetadata | null | undefined;
}) {
  if (asset?.text) {
    return (
      <pre className="relative z-10 min-h-[300px] w-full overflow-auto whitespace-pre-wrap p-6 text-left text-sm leading-relaxed text-ink-900">
        {asset.text}
      </pre>
    );
  }

  if (asset?.url && file.mimeType.startsWith("image/")) {
    return (
      <div className="relative z-10 grid min-h-[300px] place-items-center p-4">
        <object
          aria-label={`${file.originalFilename} 미리보기`}
          className="max-h-[520px] max-w-full rounded-md object-contain shadow-sm"
          data={asset.url}
          type={file.mimeType}
        >
          이미지 미리보기를 불러오지 못했습니다.
        </object>
      </div>
    );
  }

  if (asset?.url && file.mimeType === "application/pdf") {
    return (
      <iframe
        className="relative z-10 h-[520px] w-full bg-white"
        src={asset.url}
        title={`${file.originalFilename} 미리보기`}
      />
    );
  }

  return (
    <div className="relative z-10 grid min-h-[300px] place-items-center p-6">
      <div className="max-w-xl rounded-lg border border-line bg-surface-elevated/90 p-6 text-center shadow-sm">
        <p className="text-lg font-bold text-ink-900">미리보기 준비 상태</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">
          {asset?.error ??
            "PDF, 이미지, 텍스트 파일은 이 영역에서 바로 확인할 수 있습니다. 변환이 필요한 문서는 다운로드로 확인해주세요."}
        </p>
        <p className="mt-3 text-sm text-ink-500">
          상태: {previewStatusLabel(preview?.status)} · 페이지 수:{" "}
          {preview?.pageCount ?? "확인 전"}
          {preview?.errorCode ? ` · ${preview.errorCode}` : ""}
        </p>
      </div>
    </div>
  );
}

function AnnotationMarker({
  annotation,
  tone
}: {
  annotation: Pick<CaseFileAnnotation, "xPct" | "yPct"> | AnnotationTarget;
  tone: "draft" | "saved";
}) {
  const x = numericPct(annotation.xPct);
  const y = numericPct(annotation.yPct);
  return (
    <span
      className={`pointer-events-none absolute z-40 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-sm ${
        tone === "draft" ? "border-white bg-danger" : "border-white bg-brand-600"
      }`}
      style={{ left: `${String(x)}%`, top: `${String(y)}%` }}
    />
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)}B`;
  if (bytes < 1024 * 1024) return `${String(Math.round(bytes / 1024))}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function fileKindLabel(kind: string): string {
  const labels: Record<string, string> = {
    behavioral_observation: "행동관찰",
    direct_edit_revision: "직접 수정본",
    interview_summary: "면담 요약",
    other: "기타",
    report_draft: "보고서 초안",
    response_sheet: "반응지",
    scoring_sheet: "채점표",
    test_result: "검사 결과"
  };
  return labels[kind] ?? "기타 자료";
}

function scanStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    blocked: "차단됨",
    clean: "검사 완료",
    failed: "확인 필요",
    pending: "검사 중",
    review_required: "검토 필요"
  };
  return labels[status] ?? "확인 전";
}

function previewStatusLabel(status: PreviewMetadata["status"] | undefined): string {
  const labels: Record<PreviewMetadata["status"], string> = {
    failed: "변환 실패",
    pending: "준비 중",
    ready: "준비 완료"
  };
  return status ? labels[status] : "상태 미확인";
}

function annotationStatusLabel(status: CaseFileAnnotation["status"]): string {
  const labels: Record<CaseFileAnnotation["status"], string> = {
    active: "열림",
    resolved: "해결됨"
  };
  return labels[status];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function roundPct(value: number): number {
  return Math.round(value * 10) / 10;
}

function numericPct(value: string | number): number {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? clamp(numberValue, 0, 100) : 0;
}

function formatPct(value: string | number): string {
  return numericPct(value).toFixed(1);
}
