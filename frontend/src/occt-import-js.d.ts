declare module 'occt-import-js' {
  interface OcctMesh {
    attributes: {
      position: { array: ArrayLike<number> }
      normal?: { array: ArrayLike<number> }
    }
    index?: { array: ArrayLike<number> }
    color?: [number, number, number]
  }

  interface OcctResult {
    meshes: OcctMesh[]
  }

  interface OcctOptions {
    locateFile?: (name: string) => string
  }

  function occtImportJs(options?: OcctOptions): Promise<{
    ReadStepFile: (buffer: Uint8Array, params: null) => OcctResult
  }>

  export default occtImportJs
}
