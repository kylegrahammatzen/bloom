import mongoose from 'mongoose';
import { z } from 'zod';

type MongooseFieldConfig = {
  type?: typeof String | typeof Number | typeof Boolean | typeof Date | typeof mongoose.Schema.Types.ObjectId | typeof mongoose.Schema.Types.Mixed;
  required?: boolean;
  default?: unknown | (() => unknown);
  unique?: boolean;
  sparse?: boolean;
  lowercase?: boolean;
  trim?: boolean;
  min?: number;
  max?: number;
  minlength?: number;
  maxlength?: number;
  enum?: string[];
  ref?: string;
  validate?: {
    validator: (value: unknown) => boolean;
    message: string;
  };
};

type MongooseSchemaDefinition = Record<string, any>;

export function zId(ref: string) {
  return z.custom<mongoose.Types.ObjectId>(
    (val) => val instanceof mongoose.Types.ObjectId,
    { message: `Invalid ObjectId for ${ref}` }
  ).describe(`ref:${ref}`);
}

function parseString(zodType: any, baseConfig: Partial<MongooseFieldConfig>): MongooseFieldConfig {
  const config: MongooseFieldConfig = { type: String, ...baseConfig };
  const def = zodType._def || zodType.def;

  if (def?.checks) {
    for (const check of def.checks) {
      if ((check as any).kind === 'max') config.maxlength = (check as any).value;
      if ((check as any).kind === 'min') config.minlength = (check as any).value;
    }
  }

  if (zodType.maxLength !== null && zodType.maxLength !== undefined) {
    config.maxlength = zodType.maxLength;
  }
  if (zodType.minLength !== null && zodType.minLength !== undefined) {
    config.minlength = zodType.minLength;
  }

  return config;
}

function parseNumber(zodType: any, baseConfig: Partial<MongooseFieldConfig>): MongooseFieldConfig {
  const config: MongooseFieldConfig = { type: Number, ...baseConfig };
  const def = zodType._def || zodType.def;

  if (def?.checks) {
    for (const check of def.checks) {
      if ((check as any).kind === 'max') config.max = (check as any).value;
      if ((check as any).kind === 'min') config.min = (check as any).value;
      if ((check as any).kind === 'int') {
        config.validate = {
          validator: Number.isInteger,
          message: '{PATH} must be an integer',
        };
      }
    }
  }

  return config;
}

function parseBoolean(baseConfig: Partial<MongooseFieldConfig>): MongooseFieldConfig {
  return { type: Boolean, ...baseConfig };
}

function parseDate(baseConfig: Partial<MongooseFieldConfig>): MongooseFieldConfig {
  return { type: Date, ...baseConfig };
}

function parseEnum(values: any, baseConfig: Partial<MongooseFieldConfig>): MongooseFieldConfig {
  let enumValues: string[];

  if (Array.isArray(values)) {
    enumValues = [...values];
  } else if (values && typeof values === 'object') {
    enumValues = Object.values(values);
  } else {
    enumValues = [];
  }

  return { type: String, enum: enumValues, ...baseConfig };
}

function parseObjectId(ref: string, baseConfig: Partial<MongooseFieldConfig>): MongooseFieldConfig {
  return { type: mongoose.Schema.Types.ObjectId, ref, ...baseConfig };
}

function parseObject(zodObject: any): MongooseSchemaDefinition {
  const definition: MongooseSchemaDefinition = {};

  for (const [key, value] of Object.entries(zodObject.shape)) {
    definition[key] = parseZodType(value);
  }

  return definition;
}

function parseArray(zodArray: any): any[] {
  const def = zodArray._def || zodArray.def;
  const elementType = parseZodType(def.type);
  return [elementType];
}

function parseZodType(zodType: any, fieldPath: string = 'root'): any {
  let currentType: any = zodType;
  const config: Partial<MongooseFieldConfig> = {};

  while (currentType) {
    const zodDef = (currentType._def || currentType.def) as any;
    const typeName = zodDef?.typeName || zodDef?.type;

    if (typeName === 'ZodString' || typeName === 'string') {
      return parseString(currentType, config);
    }

    if (typeName === 'ZodNumber' || typeName === 'number') {
      return parseNumber(currentType, config);
    }

    if (typeName === 'ZodBoolean' || typeName === 'boolean') {
      return parseBoolean(config);
    }

    if (typeName === 'ZodDate' || typeName === 'date') {
      return parseDate(config);
    }

    if (typeName === 'ZodEnum' || typeName === 'enum') {
      return parseEnum(zodDef.values, config);
    }

    if (typeName === 'ZodOptional' || typeName === 'optional') {
      config.required = false;
      currentType = zodDef.innerType;
      continue;
    }

    if (typeName === 'ZodDefault' || typeName === 'default') {
      const defaultValue = zodDef.defaultValue;
      config.default = typeof defaultValue === 'function' ? defaultValue : () => defaultValue;
      currentType = zodDef.innerType;
      continue;
    }

    if (typeName === 'ZodEffects' || typeName === 'effects') {
      const effect = zodDef.effect;

      if (effect?.type === 'transform') {
        const transformStr = effect.transform.toString();

        if (transformStr.includes('toLowerCase')) {
          config.lowercase = true;
        }
        if (transformStr.includes('trim')) {
          config.trim = true;
        }
      }

      currentType = zodDef.schema;
      continue;
    }

    if (typeName === 'ZodCustom' || typeName === 'custom') {
      const description = zodDef.description;

      if (description?.startsWith('ref:')) {
        const ref = description.slice(4);
        return parseObjectId(ref, config);
      }

      return { type: mongoose.Schema.Types.Mixed, ...config };
    }

    if (typeName === 'ZodObject' || typeName === 'object') {
      return parseObject(currentType);
    }

    if (typeName === 'ZodArray' || typeName === 'array') {
      return parseArray(currentType);
    }

    if (typeName === 'ZodRecord' || typeName === 'record') {
      return { type: mongoose.Schema.Types.Mixed, ...config };
    }

    if (typeName === 'ZodAny' || typeName === 'any') {
      return { type: mongoose.Schema.Types.Mixed, ...config };
    }

    if (typeName === 'ZodUnknown' || typeName === 'unknown') {
      return { type: mongoose.Schema.Types.Mixed, ...config };
    }

    break;
  }

  const finalDef = (currentType?._def || currentType?.def) as any;
  throw new Error(`Unsupported Zod type at '${fieldPath}': ${finalDef?.typeName || finalDef?.type || 'unknown'}. Full type: ${JSON.stringify(currentType, null, 2)}`);
}

export function mongooseSchema<T extends z.ZodRawShape>(
  zodSchema: z.ZodObject<T>
): mongoose.Schema {
  const definition: MongooseSchemaDefinition = {};

  for (const [key, value] of Object.entries(zodSchema.shape)) {
    definition[key] = parseZodType(value);
  }

  return new mongoose.Schema(definition);
}
