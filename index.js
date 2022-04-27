const path = require('path')
const PluginTitle = 'CircularVueComponentsPlugin'

class CircularVueComponentsPlugin {
  constructor() {
    this.circles = []
    this.compilation = null
    this.components = {}
  }
  apply(compiler) {
    compiler.hooks.compilation.tap(PluginTitle, (compilation) => {
      this.compilation = compilation
      compilation.hooks.afterOptimizeModuleIds.tap(PluginTitle, (modules) => {
        const counted = {}
        for (const module of modules) {
          const resource = this.getResource(module)
          if (counted[resource]) {
            continue
          }
          this.getComponentDep(module)
          counted[resource] = true
        }
        const circles = this.getCircles()
        const errs = circles.map(circle => circle.join(' ---> '))
        compilation.warnings.push('circular components: \n' + errs.join('\n\n'))
      })
    })
  }
  getComponentDep(module) {

    // .vue -> .vue?vue&type=script -> .vue

    const resource = this.getResource(module)
    if (!resource || !resource.endsWith('.vue')) {
      return
    }
    if (this.components[resource] && this.components[resource].length) return
    this.components[module.resource] = []
    const countedDep = {}
    for (const dependency of module.dependencies) {
      const depModule = this.getDepModule(dependency)
      const depResource = this.getResource(depModule)
      if (countedDep[depResource] || !depResource.includes('.vue?vue&type=script')) {
        countedDep[resource] = true
        continue
      }

      const tempScriptDep = depModule.dependencies.find(queryModule => {
        return this.getResource(this.getDepModule(queryModule)) === depResource
      })
      if (tempScriptDep) {
        const tempScriptModule = this.getDepModule(tempScriptDep)
        const countedComp = {}
        tempScriptModule.dependencies.forEach(dep => {
          const mResource = this.getResource(this.getDepModule(dep))
          if (mResource.endsWith('.vue') && !countedComp[mResource]) {
            this.components[resource].push(mResource)
          }
          countedComp[mResource] = true
        })
      }
      countedDep[resource] = true
    }
  }

  getCircles() {
    const circles = []
    const countedStart = {}
    Object.keys(this.components).forEach(comp => {
      isCircular.call(this, comp, [], {})
    })
    return circles

    function isCircular(comp, currentPath, currentPathComps) {
      if (currentPathComps[comp]) {
        const circularPath = [...currentPath, comp]

        // filter repeat circles
        // a --> b --> c --> d --> b    b --> c ==> d --> b
        const isRepeat = !currentPath.every(p => {
          if (countedStart[p]) {
            return false
          } else {
            countedStart[p] = true
            return true
          }
        })
        if (!isRepeat) {
          circles.push(circularPath)
        }
      } else {
        currentPathComps[comp] = true
        if (this.components[comp]) {
          for (const dep of this.components[comp]) {
            const depPath = [...currentPath, comp]
            isCircular.call(this, dep, depPath, Object.assign(currentPathComps))
            currentPath = depPath
          }
        }
      }
    }
  }

  getDepModule(dependency) {
    if (this.compilation.moduleGraph) {
      return this.compilation.moduleGraph.getModule(dependency)
    } else {
      return dependency.module
    }
  }
  getResource(module) {
    return module && module.resource
      ? path.resolve(process.cwd(), module.resource)
      : ''
  }
}

module.exports = CircularVueComponentsPlugin
