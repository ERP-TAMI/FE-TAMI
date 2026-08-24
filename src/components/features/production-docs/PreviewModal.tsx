import type { StyleProductionDocDetail } from "@/types/production-doc";
import { SizeSpecTable } from "./SizeSpecTable";

interface Props {
  doc: StyleProductionDocDetail;
  styleName: string;
  onClose: () => void;
}

export function PreviewModal({ doc, styleName, onClose }: Props) {
  const sizeImgsData = Array.isArray(doc.sizeData)
    ? doc.sizeData
        .filter(
          (r: unknown): r is { imageUrl: string } =>
            typeof r === "object" &&
            r !== null &&
            "imageUrl" in r &&
            typeof (r as { imageUrl: unknown }).imageUrl === "string",
        )
        .map((r) => r.imageUrl)
    : [];
  const sizeImgsRows = Array.isArray(doc.sizeRows)
    ? doc.sizeRows
        .filter((r): r is typeof r & { imageUrl: string } => typeof r?.imageUrl === "string")
        .map((r) => r.imageUrl)
    : [];
  const sizeImages = Array.from(new Set([...sizeImgsData, ...sizeImgsRows]));

  const dynamicSections = (doc.sections || []).filter((s) => !s.isFixed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-gray-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Xem trước tài liệu sản xuất
            </h3>
            <p className="text-xs text-gray-500">{styleName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Document Canvas */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-gray-50/50 dark:bg-gray-950/40">
          <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 md:p-8 shadow-sm dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 space-y-7">
            {/* Title Header */}
            <div className="text-center border-b border-gray-200 pb-4 dark:border-gray-800">
              <h2 className="text-xl font-bold tracking-wider text-gray-900 dark:text-white uppercase">
                TÀI LIỆU SẢN XUẤT TIẾNG VIỆT
              </h2>
              <p className="text-xs text-gray-500 mt-1">Mẫu Fit: {styleName}</p>
            </div>

            {/* Section 01 & Section 02 Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Section 01 */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  01. MÔ TẢ HÌNH DÁNG
                </h4>
                {doc.section1ImageUrl && (
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-2 dark:border-gray-800 dark:bg-gray-800/60">
                    <img
                      src={doc.section1ImageUrl}
                      alt="Mô tả hình dáng"
                      className="max-h-56 w-full object-contain rounded-lg"
                    />
                  </div>
                )}
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {doc.section1Description || "—"}
                </p>
              </div>

              {/* Section 02 */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  02. PHỤ LIỆU
                </h4>
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3.5 dark:border-gray-800 dark:bg-gray-900/60">
                  <pre className="text-xs font-mono whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                    {doc.section2Accessories || "—"}
                  </pre>
                </div>
              </div>
            </div>

            {/* Section 03 */}
            <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
              <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                03. LƯU Ý TRẢI CẮT
              </h4>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {doc.section3Notes || "—"}
              </p>
            </div>

            {/* Section 04 */}
            <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
              <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                04. COMMENT GÓP Ý KHÁCH HÀNG
              </h4>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {doc.section4CustomerFeedback || "—"}
              </p>
            </div>

            {/* Section 05: THÔNG SỐ FULL SIZE */}
            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                05. THÔNG SỐ FULL SIZE
              </h4>

              {/* Full Width Size Spec Images */}
              {sizeImages.length > 0 && (
                <div className="space-y-4">
                  {sizeImages.map((url, i) => (
                    <div
                      key={i}
                      className="overflow-hidden rounded-xl border border-gray-200 bg-white p-2 shadow-2xs dark:border-gray-800 dark:bg-gray-900"
                    >
                      <img
                        src={url}
                        alt={`Thông số size ${i + 1}`}
                        className="w-full max-h-[600px] object-contain rounded-lg bg-gray-50 dark:bg-gray-800/60"
                      />
                    </div>
                  ))}
                </div>
              )}

              {doc.sizeRows && <SizeSpecTable rows={doc.sizeRows} />}
            </div>

            {/* Dynamic Custom Sections 06+ */}
            {dynamicSections.map((sec, idx) => {
              const secNum = String(idx + 6).padStart(2, "0");
              return (
                <div
                  key={sec.id || idx}
                  className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800"
                >
                  <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    {secNum}. {sec.title || `MỤC ${secNum}`}
                  </h4>

                  {sec.content && (
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {sec.content}
                    </p>
                  )}

                  {(sec.imageGroups || []).map((grp, grpIdx) => (
                    <div key={grpIdx} className="space-y-2 pt-1">
                      {grp.heading && (
                        <h5
                          className={`text-xs font-bold underline ${
                            grp.headingColor === "red"
                              ? "text-red-600"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {grp.heading}
                        </h5>
                      )}
                      {grp.imageUrls && grp.imageUrls.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                          {grp.imageUrls.map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt=""
                              className="w-28 h-28 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Document Attachments preview */}
            {doc.attachments && doc.attachments.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  TÀI LIỆU ĐÍNH KÈM ({doc.attachments.length})
                </h4>
                <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
                  {doc.attachments.map((att) => (
                    <li
                      key={att.documentId}
                      className="flex items-center justify-between p-3 text-xs"
                    >
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {att.title}
                      </span>
                      <span className="font-mono text-gray-400">
                        {att.documentCode || "DOC"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-gray-200 px-6 py-3.5 dark:border-gray-800 bg-white dark:bg-gray-900">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
