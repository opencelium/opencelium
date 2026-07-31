import {Card} from "@shared/ui/primitives/Card";
import {Button} from "@shared/ui/primitives/Button";
import {Icon} from "@shared/ui/primitives/Icon";
import {Typography} from "@shared/ui/primitives/Typography";

type CrashScreenProps = {
    title: string
    subtitle: string
    retryLabel: string
    onRetry: () => void
    reloadLabel?: string
    onReload?: () => void
    testId: string
}

export function CrashScreen({
    title,
    subtitle,
    retryLabel,
    onRetry,
    reloadLabel,
    onReload,
    testId,
}: CrashScreenProps) {
    return (
        <div
            style={{
                display: 'flex',
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                minHeight: 240,
                padding: 24,
            }}
        >
            <Card elevated style={{maxWidth: 460, width: '100%'}}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: 12,
                    }}
                >
                    <Icon name="info" size={48} color="danger"/>
                    <Typography variant="title" isBold>{title}</Typography>
                    <Typography variant="body" isSubtle>{subtitle}</Typography>
                    <div style={{display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center'}}>
                        <Button type="primary" iconLeft="refresh" onClick={onRetry} testId={`${testId}-retry`}>
                            {retryLabel}
                        </Button>
                        {reloadLabel && onReload && (
                            <Button onClick={onReload} testId={`${testId}-reload`}>
                                {reloadLabel}
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    )
}
