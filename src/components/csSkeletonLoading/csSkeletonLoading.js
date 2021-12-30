import React, {Component} from 'react';
import {
    Card, SkeletonBodyText, SkeletonDisplayText,
    SkeletonPage,
    Stack, TextContainer,
    Spinner,
    Layout,
    Loading,
    Frame,
} from '@shopify/polaris';

function CsSkeletonLoading() {
    return (
        <React.Fragment>
            {/*<Loading/>*/}
        <SkeletonPage secondaryActions={2} fullWidth={true}>
            <Layout>
                <Layout.Section>
                    <Card sectioned>
                        <TextContainer>
                            <SkeletonDisplayText size={"small"}/>
                        </TextContainer>
                        <TextContainer>
                            <div align="center" className={"mt-3"}><Spinner size="large" color="teal" /></div>
                            <SkeletonBodyText lines={3}/>
                        </TextContainer>
                    </Card>
                </Layout.Section>

            </Layout>
        </SkeletonPage>
        </React.Fragment>
    );
}
export default CsSkeletonLoading;
