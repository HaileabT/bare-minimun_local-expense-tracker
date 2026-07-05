import { Request } from "express";

export interface ValidationOutput<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export function getIDParam(params: Request["params"]): {
  id?: number;
  err?: string;
} {
  const idRaw = params["id"];
  const id: string | undefined =
    typeof idRaw === "string"
      ? idRaw
      : Array.isArray(idRaw)
        ? idRaw.join("")
        : undefined;
  if (!id) {
    return { err: "no id" };
  }
  let idNum: number | undefined;
  try {
    idNum = parseInt(id);
  } catch (err) {
    return { err: "invalid id" };
  }

  return { id: idNum };
}

export function isValidDate(str: string): boolean {
  const date = new Date(str);
  return !isNaN(date.getTime());
}
