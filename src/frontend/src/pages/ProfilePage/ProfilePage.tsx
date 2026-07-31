import PageWrapper from '@pages/PageWrapper/PageWrapper'
import { UserDetailsCard } from '@pages/ProfilePage/components/UserDetailsCard'
import { UpdatePasswordCard } from '@pages/ProfilePage/components/UpdatePasswordCard'
import { PermissionsCard } from '@pages/ProfilePage/components/PermissionsCard'

const rowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
    gap: 24,
    alignItems: 'stretch',
}

const ProfilePage = () => (
    <PageWrapper>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24 }}>
            <div style={rowStyle}>
                <UserDetailsCard style={{ height: '100%' }} />
                <PermissionsCard style={{ height: '100%' }} />
            </div>
            <div style={rowStyle}>
                <UpdatePasswordCard />
            </div>
        </div>
    </PageWrapper>
)

export default ProfilePage
