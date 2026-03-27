declare module 'occt-import-js' {
  interface OcctMesh {
    attributes: {
      position: { array: Float32Array }
      normal?: { array: Float32Array }
    }
    index?: { array: Uint32Array }
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
