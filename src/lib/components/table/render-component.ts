import type { Component, ComponentProps, Snippet } from 'svelte';

/**
 * A helper class to identify Svelte components in columnDef.cell and columnDef.header properties.
 */
export class RenderComponentConfig<TComponent extends Component> {
	constructor(
		public component: TComponent,
		public props: ComponentProps<TComponent> | Record<string, never> = {}
	) {}
}

/**
 * A helper class to identify Svelte Snippets in columnDef.cell and columnDef.header properties.
 */
export class RenderSnippetConfig<TProps> {
	constructor(
		public snippet: Snippet<[TProps]>,
		public params: TProps
	) {}
}

/**
 * A helper function to create cells from Svelte components through ColumnDef's cell and header properties.
 */
export const renderComponent = <
	TComponent extends Component<Record<string, unknown>>,
	TProps extends ComponentProps<TComponent>
>(
	component: TComponent,
	props: TProps
) => new RenderComponentConfig(component, props);

/**
 * A helper function to create cells from Svelte Snippets through ColumnDef's cell and header properties.
 */
export const renderSnippet = <TProps>(snippet: Snippet<[TProps]>, params: TProps) =>
	new RenderSnippetConfig(snippet, params);
