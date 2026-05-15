import { UserTable } from '@/entities/user/ui/UserTable'
import { createUserRowActions } from '@/entities/user/model/actions'
import {useUserTable} from "@entities/user/model/userSelectors.ts";
import {LoadingPage} from "@shared/ui/feedback/LoadingPage";

export default function UsersPage() {

  const { data, isLoading } = useUserTable({
    page: 1,
    limit: 20,
  })

  const actions = createUserRowActions({
    onEdit: (user) => {
      console.log('edit', user)
    },
    onDelete: (user) => {
      console.log('delete', user)
    },
  })


  if (isLoading) {
    return <LoadingPage/>
  }

  return (
    <>
      <UserTable data={data} actions={actions}/>
    </>
  )
}
