import { vi } from "vitest";
export const mockReportError = vi.fn();
export const createReportError = vi.fn().mockReturnValue(mockReportError);
//# sourceMappingURL=createReportError.js.map