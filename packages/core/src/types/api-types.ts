/**
 * TypeDoc API data types
 * Based on the JSON schema used in Expo documentation
 */

/**
 * TypeDoc ReflectionKind enum values
 * @see https://typedoc.org/api/enums/Models.ReflectionKind.html
 */
export enum ReflectionKind {
	Project = 1,
	Module = 2,
	Namespace = 4,
	Enum = 8,
	EnumMember = 16,
	Variable = 32,
	Function = 64,
	Class = 128,
	Interface = 256,
	Constructor = 512,
	Property = 1024,
	Method = 2048,
	CallSignature = 4096,
	IndexSignature = 8192,
	ConstructorSignature = 16384,
	Parameter = 32768,
	TypeLiteral = 65536,
	TypeParameter = 131072,
	Accessor = 262144,
	GetSignature = 524288,
	SetSignature = 1048576,
	TypeAlias = 2097152,
	Reference = 4194304,
}

export type CommentText = {
	kind: "text" | "code";
	text: string;
};

export type Comment = {
	summary?: CommentText[];
	blockTags?: Array<{
		tag: string;
		content: CommentText[];
	}>;
};

export type TypeInfo =
	| { type: "intrinsic"; name: string }
	| { type: "literal"; value: string | number | boolean }
	| { type: "reference"; name: string; qualifiedName?: string }
	| { type: "array"; elementType: TypeInfo }
	| { type: "union"; types: TypeInfo[] }
	| { type: "reflection"; declaration?: ApiDeclaration };

export type Signature = {
	name: string;
	comment?: Comment;
	parameters?: Array<{
		name: string;
		type?: TypeInfo;
		comment?: Comment;
	}>;
	type?: TypeInfo;
};

export type ApiDeclaration = {
	name: string;
	variant: "project" | "declaration" | "signature";
	kind: number;
	comment?: Comment;
	children?: ApiDeclaration[];
	type?: TypeInfo;
	signatures?: Signature[];
	defaultValue?: string;
	flags?: {
		isOptional?: boolean;
		isReadonly?: boolean;
		isStatic?: boolean;
	};
};
