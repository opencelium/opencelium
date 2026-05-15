import React from 'react';
import { SearchOutlined } from '@ant-design/icons';
import { Input } from 'antd';

type Props = {
	value: string;
	onChange: (next: string) => void;
};

export const UrlQueryParamsFilter: React.FC<Props> = ({ value, onChange }) => {
	return (
		<div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
			<Input
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder="Filter by key or value"
				prefix={<SearchOutlined />}
				size="large"
			/>
		</div>
	);
};
