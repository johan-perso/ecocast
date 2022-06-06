// Supprimer un code d'association
async function ecocast__deleteAssociationCode(code, apiDomain){
	await fetch(`http://${apiDomain}/api/deleteCode?code=${code}`, { method: 'DELETE' })
}