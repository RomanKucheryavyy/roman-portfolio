// Old-design shim: the panel now lives with the résumé builder, its last real
// user (src/app/resume/_ui). The old home sections still import it from here
// until they are deleted with the rest of the old design.
export * from '@/app/resume/_ui/Panel'
export { default } from '@/app/resume/_ui/Panel'
