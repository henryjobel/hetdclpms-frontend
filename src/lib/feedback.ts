"use client";

type ToastType = "success" | "error" | "info";

function ensureToastHost() {
  let host = document.getElementById("app-toast-host");
  if (!host) {
    host = document.createElement("div");
    host.id = "app-toast-host";
    host.className = "fixed top-4 right-4 z-[9999] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2";
    document.body.appendChild(host);
  }
  return host;
}

export function showToast(message: string, type: ToastType = "info") {
  if (typeof window === "undefined") return;

  const host = ensureToastHost();
  const toast = document.createElement("div");
  const tone = {
    success: "border-green-200 bg-green-50 text-green-800",
    error: "border-red-200 bg-red-50 text-red-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
  }[type];

  toast.className = `rounded-lg border px-4 py-3 text-sm shadow-lg transition-all ${tone}`;
  toast.textContent = message;
  host.appendChild(toast);

  window.setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-6px)";
    window.setTimeout(() => toast.remove(), 180);
  }, 2600);
}

export function confirmAction(message: string, title = "Confirm Delete") {
  if (typeof window === "undefined") return Promise.resolve(false);

  return new Promise<boolean>((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 px-4";

    const modal = document.createElement("div");
    modal.className = "w-full max-w-sm rounded-xl bg-white shadow-2xl";

    const header = document.createElement("div");
    header.className = "border-b border-gray-100 px-5 py-4";
    header.innerHTML = `<h3 class="text-base font-semibold text-gray-900">${title}</h3><p class="mt-1 text-sm text-gray-500">${message}</p>`;

    const footer = document.createElement("div");
    footer.className = "flex justify-end gap-2 px-5 py-4";

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50";
    cancel.textContent = "Cancel";

    const confirm = document.createElement("button");
    confirm.type = "button";
    confirm.className = "rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600";
    confirm.textContent = "Delete";

    function close(result: boolean) {
      overlay.remove();
      resolve(result);
    }

    cancel.onclick = () => close(false);
    confirm.onclick = () => close(true);
    overlay.onclick = (event) => {
      if (event.target === overlay) close(false);
    };

    footer.append(cancel, confirm);
    modal.append(header, footer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    confirm.focus();
  });
}
