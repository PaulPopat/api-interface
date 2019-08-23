import axios from "axios";
import { Checker, IsType } from "@paulpopat/safe-type";

type Metadata = {
  base: string;
};

type BodyType<TBody, TReturns> = {
  url: string;
  parameters: { [key: string]: Checker<string> };
  returns: Checker<TReturns>;
  method: "PUT" | "POST" | "PATCH";
  body: Checker<TBody>;
};

type UrlType<TReturns> = {
  url: string;
  parameters: { [key: string]: Checker<string> };
  returns: Checker<TReturns>;
  method: "GET" | "DELETE";
};

type PlainUrlType<TReturns> = {
  url: string;
  returns: Checker<TReturns>;
  method: "GET" | "DELETE";
};

type PlainBodyType<TBody, TReturns> = {
  url: string;
  returns: Checker<TReturns>;
  method: "PUT" | "POST" | "PATCH";
  body: Checker<TBody>;
};

type Apis = {
  [key: string]:
    | BodyType<any, any>
    | UrlType<any>
    | PlainUrlType<any>
    | PlainBodyType<any, any>;
};

type UrlFunction<TReturns, TSchema extends UrlType<TReturns>> = (
  parameters: {
    [key in keyof TSchema["parameters"]]: IsType<TSchema["parameters"][key]>
  }
) => Promise<IsType<TSchema["returns"]>>;

function GenerateUrlType<TReturns, TSchema extends UrlType<TReturns>>(
  schema: TSchema,
  metadata: Metadata,
  headers: { [key: string]: string }
) {
  return async (
    parameters: {
      [key in keyof TSchema["parameters"]]: IsType<TSchema["parameters"][key]>
    }
  ) => {
    let url = schema.url;
    for (const key in parameters) {
      if (!parameters.hasOwnProperty(key)) {
        continue;
      }

      const p = encodeURIComponent(parameters[key]);
      const k = encodeURIComponent(key);
      if (url.indexOf(":" + key) > -1) {
        url = url.replace(":" + key, p);
        continue;
      }

      if (url.indexOf("?") > -1) {
        url += "&" + k + "=" + p;
        continue;
      }

      url += "&" + k + "=" + p;
    }

    if (url.indexOf(":") > -1) {
      throw new Error(`Parameter has not been filled in ${url}`);
    }

    const { data: result } = await axios.request({
      method: schema.method,
      url: url,
      baseURL: metadata.base,
      headers
    });
    if (!schema.returns(result)) {
      throw new Error(
        `Unexpected response type from ${schema.method} - ${schema.url}`
      );
    }

    return result as IsType<TSchema["returns"]>;
  };
}

type BodyFunction<
  TBody,
  TReturns,
  TSchema extends BodyType<TBody, TReturns>
> = (
  parameters: {
    [key in keyof TSchema["parameters"]]: IsType<TSchema["parameters"][key]>
  },
  body: IsType<TSchema["body"]>
) => Promise<IsType<TSchema["returns"]>>;

function GenerateBodyType<
  TBody,
  TReturns,
  TSchema extends BodyType<TBody, TReturns>
>(schema: TSchema, metadata: Metadata, headers: { [key: string]: string }) {
  return async (
    parameters: {
      [key in keyof TSchema["parameters"]]: IsType<TSchema["parameters"][key]>
    },
    body: IsType<TSchema["body"]>
  ) => {
    let url = schema.url;
    for (const key in parameters) {
      if (!parameters.hasOwnProperty(key)) {
        continue;
      }

      const p = encodeURIComponent(parameters[key]);
      if (url.indexOf(":" + key) > -1) {
        url = url.replace(":" + key, p);
        continue;
      }

      throw new Error(`Parameter ${key} does not exist in ${schema.url}`);
    }

    if (url.indexOf(":") > -1) {
      throw new Error(`Parameter has not been filled in ${url}`);
    }

    const { data: result } = await axios.request({
      method: schema.method,
      url: url,
      data: body,
      baseURL: metadata.base,
      headers
    });
    if (!schema.returns(result)) {
      throw new Error(
        `Unexpected response type from ${schema.method} - ${schema.url}`
      );
    }

    return result as IsType<TSchema["returns"]>;
  };
}

type PlainUrlFunction<
  TReturns,
  TSchema extends PlainUrlType<TReturns>
> = () => Promise<IsType<TSchema["returns"]>>;

function GeneratePlainUrlType<TReturns, TSchema extends PlainUrlType<TReturns>>(
  schema: TSchema,
  metadata: Metadata,
  headers: { [key: string]: string }
) {
  return async () => {
    const { data: result } = await axios.request({
      method: schema.method,
      url: schema.url,
      baseURL: metadata.base,
      headers
    });
    if (!schema.returns(result)) {
      throw new Error(
        `Unexpected response type from ${schema.method} - ${schema.url}`
      );
    }

    return result as IsType<TSchema["returns"]>;
  };
}

type PlainBodyFunction<
  TBody,
  TReturns,
  TSchema extends PlainBodyType<TBody, TReturns>
> = (body: IsType<TSchema["body"]>) => Promise<IsType<TSchema["returns"]>>;

function GeneratePlainBodyType<
  TBody,
  TReturns,
  TSchema extends PlainBodyType<TBody, TReturns>
>(schema: TSchema, metadata: Metadata, headers: { [key: string]: string }) {
  return async (body: IsType<TSchema["body"]>) => {
    const { data: result } = await axios.request({
      method: schema.method,
      url: schema.url,
      baseURL: metadata.base,
      data: body,
      headers
    });
    if (!schema.returns(result)) {
      throw new Error(
        `Unexpected response type from ${schema.method} - ${schema.url}`
      );
    }

    return result as IsType<TSchema["returns"]>;
  };
}

type ApiInterface<TSchema extends Apis> = {
  [key in keyof TSchema]: TSchema[key] extends BodyType<any, any>
    ? BodyFunction<TSchema[key]["body"], TSchema[key]["returns"], TSchema[key]>
    : TSchema[key] extends UrlType<any>
    ? UrlFunction<TSchema[key]["returns"], TSchema[key]>
    : TSchema[key] extends PlainUrlType<any>
    ? PlainUrlFunction<TSchema[key]["returns"], TSchema[key]>
    : TSchema[key] extends PlainBodyType<any, any>
    ? PlainBodyFunction<
        TSchema[key]["body"],
        TSchema[key]["returns"],
        TSchema[key]
      >
    : unknown
};

export function IsBody<TBody = {}, TReturns = {}>(
  schema:
    | BodyType<TBody, TReturns>
    | UrlType<TReturns>
    | PlainUrlType<TReturns>
    | PlainBodyType<TBody, TReturns>
): schema is BodyType<TBody, TReturns> {
  return schema.hasOwnProperty("body") && schema.hasOwnProperty("parameters");
}

export function IsUrl<TBody = {}, TReturns = {}>(
  schema:
    | BodyType<TBody, TReturns>
    | UrlType<TReturns>
    | PlainUrlType<TReturns>
    | PlainBodyType<TBody, TReturns>
): schema is UrlType<TReturns> {
  return !schema.hasOwnProperty("body") && schema.hasOwnProperty("parameters");
}

export function IsPlainUrl<TBody = {}, TReturns = {}>(
  schema:
    | BodyType<TBody, TReturns>
    | UrlType<TReturns>
    | PlainUrlType<TReturns>
    | PlainBodyType<TBody, TReturns>
): schema is PlainUrlType<TReturns> {
  return !schema.hasOwnProperty("parameters") && !schema.hasOwnProperty("body");
}

export function IsPlainBody<TBody = {}, TReturns = {}>(
  schema:
    | BodyType<TBody, TReturns>
    | UrlType<TReturns>
    | PlainUrlType<TReturns>
    | PlainBodyType<TBody, TReturns>
): schema is PlainBodyType<TBody, TReturns> {
  return !schema.hasOwnProperty("parameters") && schema.hasOwnProperty("body");
}

export function GenerateInterface<TSchema extends Apis>(
  schema: TSchema,
  metadata: Metadata
): ApiInterface<TSchema> & { headers: { [key: string]: string } } {
  const result: ApiInterface<any> = {};
  let headers: { [key: string]: string } = {};

  for (const key in schema) {
    if (!schema.hasOwnProperty(key)) {
      continue;
    }

    const api = schema[key];
    if (IsPlainBody(api)) {
      result[key] = GeneratePlainBodyType(api, metadata, headers);
    } else if (IsPlainUrl(api)) {
      result[key] = GeneratePlainUrlType(api, metadata, headers);
    } else if (IsBody(api)) {
      result[key] = GenerateBodyType(api, metadata, headers);
    } else if (IsUrl(api)) {
      result[key] = GenerateUrlType(api, metadata, headers);
    }
  }

  Object.defineProperty(result, "headers", {
    get: function() {
      return { ...headers };
    },
    set: function(v: { [key: string]: string }) {
      headers = v;
    }
  });
  return result as any;
}
