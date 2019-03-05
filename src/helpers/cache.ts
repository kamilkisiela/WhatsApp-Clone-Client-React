import { DocumentNode, FragmentDefinitionNode } from "graphql";
import { DataProxy } from "apollo-cache";
import produce from "immer";

interface PatchQueryOptions {
  query: DocumentNode;
  variables?: {
    [key: string]: any;
  };
}

interface PatchFragmentOptions {
  fragment: DocumentNode;
  fragmentName?: string;
  id: string;
}

export function createHelpers(cache: DataProxy) {
  return {
    patchQuery: patchQueryFactory(cache),
    patchFragment: patchFragmentFactory(cache)
  };
}

function patchQueryFactory(cache: DataProxy) {
  return <R>(
    { query, variables }: PatchQueryOptions,
    patchFn: (data: R) => any
  ): R => {
    const options = { query, variables };
    const obj: any = cache.readQuery(options);
    const data = produce(obj, patchFn);

    cache.writeQuery({
      ...options,
      data
    });

    return data;
  };
}

function patchFragmentFactory(cache: DataProxy) {
  return <R>(
    { id, fragment, fragmentName }: PatchFragmentOptions,
    patchFn: (data: R) => any
  ): R => {
    const __typename = getFragmentTypename(fragment);

    const frgmt: any = cache.readFragment({
      fragment,
      fragmentName,
      id
    });
    const data = produce(frgmt, patchFn);

    cache.writeFragment({
      fragment,
      fragmentName,
      id,
      data: {
        ...data,
        __typename
      }
    });

    return data;
  };
}

function getFragmentTypename(fragment: DocumentNode): string {
  const def = fragment.definitions.find(
    def => def.kind === "FragmentDefinition"
  ) as FragmentDefinitionNode;

  return def.typeCondition.name.value;
}
