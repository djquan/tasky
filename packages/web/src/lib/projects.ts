// Legacy file - re-exports from lists.ts for backward compatibility
export {
  createProject,
  createList as createArea,
  getList as getProject,
  updateList as updateProject,
  deleteList as deleteProject,
  completeList as completeProject,
  cancelList as cancelProject,
  getAllProjects
} from './lists';
