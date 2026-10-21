// Old-design shim: the hook now lives with the résumé builder, its last real
// user (src/app/resume/_ui). The old CopyButton still imports it from here
// until it is deleted with the rest of the old design.
export * from '@/app/resume/_ui/useCopyToClipboard'
export { default } from '@/app/resume/_ui/useCopyToClipboard'
