import Markdoc, { Node as MarkdocNode } from '@markdoc/markdoc';

import { ContentFormField } from '../../api';
import {
  DocumentFieldInput,
  getDefaultValue,
  serializeFromEditorState,
  createEditorSchema,
  parseToEditorState,
  parseToEditorStateMDX,
  serializeFromEditorStateMDX,
  createEditorStateFromYJS,
} from '#field-ui/markdoc';
import type { EditorSchema } from './editor/schema';
import type { EditorState } from 'prosemirror-state';
import { ContentComponent } from '../../../content-components';
import {
  MDXEditorOptions,
  MarkdocEditorOptions,
  editorOptionsToConfig,
} from './config';
import { collectDirectoriesUsedInSchema } from '../../../app/tree-key';
import { object } from '../object';
import { fixPath } from '../../../app/path-utils';
import { XmlFragment } from 'yjs';
import { prosemirrorToYXmlFragment } from 'y-prosemirror';
import { createMarkdocConfig } from './markdoc-config';

const textDecoder = new TextDecoder();

export function markdoc({
  label,
  description,
  options = {},
  components = {},
}: {
  label: string;
  description?: string;
  options?: MarkdocEditorOptions;
  components?: Record<string, ContentComponent>;
}): markdoc.Field {
  let schema: undefined | EditorSchema;
  const config = editorOptionsToConfig(options);
  let getSchema = () => {
    if (!schema) {
      schema = createEditorSchema(config, components);
    }
    return schema;
  };
  return {
    kind: 'form',
    formKind: 'content',
    defaultValue() {
      return getDefaultValue(getSchema());
    },
    Input(props) {
      return (
        <DocumentFieldInput
          description={description}
          label={label}
          {...props}
        />
      );
    },

    parse: (_, { content, other, external, slug }) => {
      return parseToEditorState(content, getSchema(), other, external, slug);
    },
    contentExtension: '.mdoc',
    validate(value) {
      return value;
    },
    directories: [
      ...collectDirectoriesUsedInSchema(
        object(
          Object.fromEntries(
            Object.entries(components).map(([name, component]) => [
              name,
              object(component.schema),
            ])
          )
        )
      ),
      ...(typeof config.image === 'object' &&
      typeof config.image.directory === 'string'
        ? [fixPath(config.image.directory)]
        : []),
    ],
    serialize(value, { slug }) {
      return {
        ...serializeFromEditorState(value, slug),
        value: undefined,
      };
    },
    reader: {
      parse: (_, { content }) => {
        const text = textDecoder.decode(content);
        return { node: Markdoc.parse(text) };
      },
    },
    collaboration: {
      toYjs(value) {
        return prosemirrorToYXmlFragment(value.doc);
      },
      fromYjs(yjsValue, awareness) {
        return createEditorStateFromYJS(
          getSchema(),
          yjsValue as XmlFragment,
          awareness
        );
      },
    },
  };
}

markdoc.createMarkdocConfig = createMarkdocConfig;

export declare namespace markdoc {
  type Field = ContentFormField<
    EditorState,
    EditorState,
    { node: MarkdocNode }
  >;
}

export function mdx({
  label,
  description,
  options = {},
  components = {},
}: {
  label: string;
  description?: string;
  options?: MDXEditorOptions;
  components?: Record<string, ContentComponent>;
}): mdx.Field {
  let schema: undefined | EditorSchema;
  const config = editorOptionsToConfig(options);
  let getSchema = () => {
    if (!schema) {
      schema = createEditorSchema(config, components);
    }
    return schema;
  };
  return {
    kind: 'form',
    formKind: 'content',
    defaultValue() {
      return getDefaultValue(getSchema());
    },
    Input(props) {
      return (
        <DocumentFieldInput
          description={description}
          label={label}
          {...props}
        />
      );
    },

    parse: (_, { content, other, external, slug }) => {
      return parseToEditorStateMDX(content, getSchema(), other, external, slug);
    },
    contentExtension: '.mdx',
    validate(value) {
      return value;
    },
    directories: [
      ...collectDirectoriesUsedInSchema(
        object(
          Object.fromEntries(
            Object.entries(components).map(([name, component]) => [
              name,
              object(component.schema),
            ])
          )
        )
      ),
      ...(typeof config.image === 'object' &&
      typeof config.image.directory === 'string'
        ? [fixPath(config.image.directory)]
        : []),
    ],
    serialize(value, { slug }) {
      return {
        ...serializeFromEditorStateMDX(value, slug),
        value: undefined,
      };
    },
    reader: {
      parse: (_, { content }) => {
        const text = textDecoder.decode(content);
        return text;
      },
    },
  };
}

export declare namespace mdx {
  type Field = ContentFormField<EditorState, EditorState, string>;
}
