import React from 'react';
import AuthForm from '../Header/AuthForm';

const AuthPage = ({ onLogin }) => {
    return (
        <div>
            <AuthForm onLogin={onLogin} />
        </div>
    );
};

export default AuthPage;